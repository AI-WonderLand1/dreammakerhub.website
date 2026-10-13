import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Alice shared-training privacy consent', () => {
  const migration = read('supabase/migrations/20261013090000_ai_training_consent.sql');
  const api = read('apps/web/app/api/privacy/ai-training/route.ts');
  const signup = read('apps/web/app/public-pages/auth/page.tsx');
  const settings = read('apps/web/app/settings/privacy/page.tsx');

  it('defaults to opt-out and denies direct customer writes', () => {
    expect(migration).toContain('enabled boolean not null default false');
    expect(migration).toContain('enable row level security');
    expect(migration).toContain('revoke all on public.ai_training_preferences from public, anon, authenticated');
    expect(migration).toContain('grant select on public.ai_training_preferences to authenticated');
    expect(migration).toContain('auth.uid()');
  });

  it('audits opt-in and withdrawal and requires confirmed accounts for ingestion', () => {
    expect(migration).toContain('ai_training_consent_events');
    expect(migration).toContain("values (v_user_id, p_enabled, v_version, 'settings')");
    expect(migration).toContain("and p.consent_version = '2026-10-13-v1'");
    expect(migration).toContain('u.email_confirmed_at is not null');
    expect(migration).toContain('grant execute on function public.has_current_ai_training_consent(uuid) to service_role');
  });

  it('requires an explicit boolean and verified session from browser API', () => {
    expect(api).toContain('supabase.auth.getUser()');
    expect(api).toContain("request.headers.get('origin')");
    expect(api).toContain("typeof (body as { enabled?: unknown }).enabled !== 'boolean'");
    expect(api).toContain("supabase.rpc('set_ai_training_consent'");
  });

  it('presents an unchecked optional choice and a reversible settings control', () => {
    expect(signup).toContain('useState(false)');
    expect(signup).toContain('alice_training_opt_in: aiTrainingOptIn');
    expect(settings).toContain('Save privacy choice');
    expect(settings).toContain('No future shared-training collection');
    expect(read('apps/web/app/settings/layout.tsx')).toContain('href: "/settings/privacy"');
  });

  it('updates privacy disclosures rather than silently treating service processing as training', () => {
    const privacy = read('apps/web/app/(public)/privacy/page.tsx');
    expect(privacy).toContain('Using AI-powered features requires processing');
    expect(privacy).toContain('Shared AI improvement and training is optional');
    expect(privacy).toContain('does not guarantee removal from models already trained');
  });
});
