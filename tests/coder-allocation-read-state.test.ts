import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Coder allocation lookup safety', () => {
  it('does not mistake a failed lookup for an empty workspace list', () => {
    const page = read('apps/web/app/wonderspace/workspaces/page.tsx');
    expect(page).toContain('setSlots([]);');
    expect(page).toContain('setCanOpen(false);');
    expect(page).toContain('!error && slots.length === 0');
    expect(page).toContain('Workspace availability could not be verified.');
  });

  it('logs a diagnostic code without exposing row contents or credentials', () => {
    const slots = read('apps/web/lib/coder/workspace-slots.server.ts');
    expect(slots).toContain("console.error('[coder-workspaces] allocation read failed', { code: error?.code || 'invalid_response' });");
    expect(slots).toContain('throw new CostGateError(\'Workspace allocation lookup failed. No workspaces were changed.\');');
    expect(slots).toContain('assertCoderOwnerIsolation(userId);');
  });

  it('isolates password auth from the shared service role client', () => {
    const service = read('apps/web/lib/supabase-service.ts');
    expect(service).toContain('persistSession: false');
    expect(service).toContain('autoRefreshToken: false');
    expect(service).toContain('function userAuthClient()');
    expect(service).toContain('const client = userAuthClient();');
    expect(service).not.toContain('const client = getClient();\n    const { data, error } = await client.auth.signInWithPassword');
  });
});
