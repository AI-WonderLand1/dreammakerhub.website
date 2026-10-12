import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { getClient } from '@/lib/supabase-service';
import { decryptSecret } from '@/lib/crypto/secrets';
import { verifiedCostPlan, reserveBillableUnits, costGateResponse, CostGateError } from '@/lib/billing/cost-guard.server';
import { PLAN_LIMITS } from '@/lib/billing/limits';

export const runtime = 'nodejs';
const schema = z.object({
  provider: z.enum(['openrouter', 'openai', 'anthropic', 'google', 'groq']).optional(),
  model: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._/:-]{0,119}$/).optional(),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(12000) })).min(1).max(20),
  system: z.string().max(4000).default(''),
  maxTokens: z.number().int().min(1).max(4096).default(1024),
  temperature: z.number().min(0).max(1).default(0.5),
  source: z.enum(['dreammakerhub', 'ai-playground', 'npc-ai-sim']).default('dreammakerhub'),
});
const endpoints: Record<string, string> = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  google: 'https://generativelanguage.googleapis.com/v1beta/models',
};

export async function POST(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: 'Sign in to use your account provider.' }, { status: 401 });
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 64 * 1024) return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid account provider request.' }, { status: 400 });
  const input = parsed.data;
  if (input.system.length + input.messages.reduce((sum, message) => sum + message.content.length, 0) > 12000) {
    return NextResponse.json({ error: 'Conversation exceeds the per-request budget.' }, { status: 413 });
  }
  try {
    // The verified identity, not a client-supplied user ID, owns the credential.
    let query = getClient().from('ai_provider_configs')
      .select('provider,default_model,base_url,api_key_encrypted,api_key_iv,api_key_tag')
      .eq('user_id', user.id);
    query = input.provider ? query.eq('provider', input.provider) : query.eq('is_active', true);
    const { data: config, error } = await query.maybeSingle();
    if (error || !config?.api_key_encrypted || !config.api_key_iv || !config.api_key_tag) {
      return NextResponse.json({ error: 'Save an encrypted API key in your account provider settings first.' }, { status: 503 });
    }
    const endpoint = endpoints[config.provider];
    const model = input.model || config.default_model;
    if (!endpoint || typeof model !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._/:-]{0,119}$/.test(model)) {
      return NextResponse.json({ error: 'This provider or model is not supported by account chat.' }, { status: 400 });
    }
    // Never fetch a user-controlled URL or send a saved key to another host.
    if (config.base_url && config.base_url.replace(/\/$/, '') !== endpoint.replace(/\/$/, '')) {
      return NextResponse.json({ error: 'Custom base URLs need a separate verified adapter.' }, { status: 400 });
    }
    const key = decryptSecret(config.api_key_encrypted, config.api_key_iv, config.api_key_tag);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let url = endpoint;
    let body: object;
    if (config.provider === 'anthropic') {
      headers['x-api-key'] = key;
      headers['anthropic-version'] = '2023-06-01';
      body = { model, messages: input.messages, system: input.system, max_tokens: input.maxTokens, temperature: input.temperature };
    } else if (config.provider === 'google') {
      url += `/${encodeURIComponent(model)}:generateContent`;
      headers['x-goog-api-key'] = key;
      body = {
        contents: input.messages.map(message => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] })),
        ...(input.system ? { systemInstruction: { parts: [{ text: input.system }] } } : {}),
        generationConfig: { maxOutputTokens: input.maxTokens, temperature: input.temperature },
      };
    } else {
      headers.Authorization = `Bearer ${key}`;
      body = { model, messages: [...(input.system ? [{ role: 'system', content: input.system }] : []), ...input.messages], max_tokens: input.maxTokens, temperature: input.temperature, stream: false };
    }
    // BYOK consumes a platform request allowance, not platform-funded AI credits.
    const plan = await verifiedCostPlan(user.id);
    await reserveBillableUnits(user.id, 'ai_requests', 1, PLAN_LIMITS[plan].apiCallsMonthly, input.source);
    const upstream = await fetch(url, {
      method: 'POST', headers, body: JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(60000),
    });
    if (!upstream.ok) return NextResponse.json({ error: 'Your account provider could not complete this request.' }, { status: 502 });
    const result = await upstream.json();
    const text = config.provider === 'anthropic'
      ? result.content?.filter((part: { type?: string }) => part.type === 'text').map((part: { text?: string }) => part.text || '').join('')
      : config.provider === 'google'
        ? result.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('')
        : result.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) return NextResponse.json({ error: 'Your account provider returned no text.' }, { status: 502 });
    return NextResponse.json({ ok: true, content: text, provider: config.provider, model, billing: { costClass: 'byok', requestUnits: 1 } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    // Never relay provider responses, saved keys, or decryption errors to clients.
    return costGateResponse(error instanceof CostGateError ? error : new Error('Account provider or usage verification is unavailable.'));
  }
}
