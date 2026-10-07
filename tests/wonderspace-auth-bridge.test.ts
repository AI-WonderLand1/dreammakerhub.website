import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('WonderSpace Supabase auth bridge', () => {
  it('prefers a verified request Bearer token over a potentially stale server cookie', () => {
    const helper = read('apps/web/lib/supabase/authenticated-user.server.ts');
    expect(helper).toContain("request.headers.get('authorization')");
    expect(helper).toContain("if (authorization)");
    expect(helper).toContain('/^Bearer\\s+(.+)$/i');
    expect(helper).toContain('await supabase.auth.getUser(token)');
    expect(helper).toContain('await supabase.auth.getUser()');
    expect(helper.indexOf('await supabase.auth.getUser(token)')).toBeLessThan(helper.indexOf('await supabase.auth.getUser()'));
    expect(helper).toContain('if (!token) return null');
    expect(helper).toContain('if (bearerResult.error || !bearerResult.data.user) return null');
    expect(helper).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(helper).not.toContain('jwtDecode');
    expect(helper).not.toContain('console.log');
  });

  it('uses the verified request user throughout workspace APIs instead of browser supplied user IDs', () => {
    for (const path of [
      'apps/web/app/api/user-workspace/options/route.ts',
      'apps/web/app/api/user-workspace/provision/route.ts',
      'apps/web/app/api/user-workspace/repository/route.ts',
      'apps/web/app/api/user-workspace/customer/provision/route.ts',
      'apps/web/app/api/user-workspace/customer/status/[slotId]/route.ts',
      'apps/web/app/api/user-workspace/coder/route.ts',
      'apps/web/app/api/user-workspace/coder/[slotId]/route.ts',
      'apps/web/app/api/user-workspace/coder/[slotId]/open/route.ts',
    ]) {
      const route = read(path);
      expect(route).toContain('authenticatedSupabaseUser(request)');
      expect(route).not.toContain('body.userId');
      expect(route).not.toContain('body.user_id');
    }
  });

  it('sends the browser session token only as an Authorization header to same-origin workspace APIs', () => {
    for (const path of [
      'apps/web/components/engines/WonderSpaceLaunch.tsx',
      'apps/web/components/engines/CustomerWorkspaceLaunch.tsx',
      'apps/web/components/engines/CoderAvailabilityIndicator.tsx',
    ]) {
      const source = read(path);
      expect(source).toContain('session?.access_token');
      expect(source).toContain('Authorization: `Bearer ${session.access_token}`');
      expect(source).not.toContain('CODER_API_TOKEN');
    }
  });
});
