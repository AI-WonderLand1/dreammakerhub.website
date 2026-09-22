import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Invoked only by a privileged scheduler. Never accept recipients from the request.
Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!serviceKey || !supabaseUrl) return new Response('Service not configured', { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${serviceKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const sender = Deno.env.get('WELCOME_FROM_EMAIL');
  if (Deno.env.get('WELCOME_EMAIL_ENABLED') !== 'true' || !apiKey || !sender) {
    return Response.json({ enabled: false, processed: 0 });
  }
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  let sent = 0;
  let deferred = 0;
  for (let i = 0; i < 10; i++) {
    const { data, error } = await db.rpc('claim_one_welcome_email');
    if (error) return Response.json({ error: 'Queue unavailable', sent, deferred }, { status: 503 });
    const job = data?.[0];
    if (!job) break;
    // This is a service welcome, not an unsolicited marketing campaign.
    const html = `<!doctype html><html><body style="margin:0;background:#0b1020;color:#f5f7ff;font-family:Arial,sans-serif"><div style="max-width:560px;margin:auto;padding:40px 24px"><h1 style="font-size:26px">Welcome to DreamMakerHub</h1><p>Your account is ready. Create a project, choose a template, and build with your AI assistant and visual editor.</p><p style="margin:32px 0"><a href="https://dreammakerhub.website/dashboard" style="background:#7865ef;color:white;padding:14px 22px;text-decoration:none;border-radius:8px">Create your first project</a></p><p style="color:#a5aec6;font-size:13px">You're receiving this service email because you created a DreamMakerHub account.</p></div></body></html>`;
    const text = 'Welcome to DreamMakerHub! Your account is ready. Create your first project at https://dreammakerhub.website/dashboard\n\nYou received this service email because you created a DreamMakerHub account.';
    let success = false;
    let providerId: string | null = null;
    let failure = 'provider_unavailable';
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `dreammakerhub-welcome-${job.id}`,
        },
        body: JSON.stringify({ from: sender, to: [job.email], subject: 'Welcome to DreamMakerHub', html, text }),
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        const payload = await response.json();
        providerId = typeof payload.id === 'string' ? payload.id : null;
        success = true;
      } else {
        failure = `provider_http_${response.status}`;
      }
    } catch {
      failure = 'provider_network_error';
    }
    const update = success
      ? { status: 'sent', sent_at: new Date().toISOString(), provider_message_id: providerId, last_error: null }
      : { status: job.attempts >= 5 ? 'failed' : 'pending', next_attempt_at: new Date(Date.now() + Math.min(60, 2 ** job.attempts) * 60_000).toISOString(), last_error: failure };
    const { error: updateError } = await db.from('onboarding_email_outbox')
      .update(update).eq('id', job.id).eq('status', 'processing').eq('attempts', job.attempts);
    if (updateError) return Response.json({ error: 'Queue update failed', sent, deferred }, { status: 503 });
    if (success) sent++; else deferred++;
  }
  return Response.json({ enabled: true, sent, deferred });
});
