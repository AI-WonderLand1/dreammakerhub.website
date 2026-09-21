import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Legacy subscription safety', () => {
  it('uses the canonical authentication and post-signup plan chooser', () => {
    const legacy = read('apps/web/components/AuthForm.tsx');
    const canonical = read('apps/web/app/public-pages/auth/page.tsx');
    expect(legacy).toContain("export { default } from '@/app/public-pages/auth/page'");
    expect(canonical).toContain('function postSignupPath(redirectTo: string)');
    expect(legacy).not.toContain('$29/mo');
  });

  it('never directly sets a subscription active from the browser', () => {
    const legacy = read('apps/web/lib/supabase-service.ts');
    expect(legacy).not.toMatch(/\.from\(['"]subscriptions['"]\)\s*\.upsert\(/);
    expect(legacy).not.toContain("status: 'active'");
    expect(legacy).toContain('Paid access requires Stripe checkout confirmation.');
  });
});
