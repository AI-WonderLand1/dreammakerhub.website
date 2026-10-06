import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';

export const dynamic = 'force-dynamic';

const PLATFORM_AGENTS = [
  { id: 'wonderbuild', name: 'WonderBuild Agent', capability: 'websites-apps' },
  { id: '3d-assets', name: '3D Asset AI', capability: '3d-assets' },
  { id: 'dashboard-assistant', name: 'Dashboard Assistant', capability: 'account-help' },
] as const;

const PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'openai', name: 'OpenAI-compatible' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'google', name: 'Google AI' },
  { id: 'groq', name: 'Groq' },
  { id: 'custom-api', name: 'Custom agent endpoint' },
] as const;

export async function GET(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, {
      status: 401,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Provider settings service is unavailable.' }, {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('ai_provider_configs')
    .select('provider,default_model,base_url,is_active,api_key_encrypted')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Provider settings could not be loaded.' }, {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  const saved = new Map((data || []).map((row) => [row.provider, row]));

  return NextResponse.json({
    source: 'ai-wonderland-account',
    settingsPath: '/dashboard/settings/agents',
    platformAgents: PLATFORM_AGENTS,
    activeProvider: (data || []).find((row) => row.is_active)?.provider || 'openrouter',
    providers: PROVIDERS.map((provider) => {
      const row = saved.get(provider.id);
      return {
        id: provider.id,
        name: provider.name,
        configured: Boolean(row),
        hasApiKey: Boolean(row?.api_key_encrypted),
        model: row?.default_model || null,
        baseUrl: row?.base_url || null,
        active: Boolean(row?.is_active),
      };
    }),
  }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
