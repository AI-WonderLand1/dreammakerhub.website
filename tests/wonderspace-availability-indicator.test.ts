import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('WonderSpace availability hint', () => {
  it('checks the existing authenticated Coder template endpoint rather than hardcoding green', () => {
    const indicator = read('apps/web/components/engines/CoderAvailabilityIndicator.tsx');
    const options = read('apps/web/app/api/user-workspace/options/route.ts');
    expect(indicator).toContain("fetch('/api/user-workspace/options'");
    expect(indicator).toContain("response.ok ? 'reachable' : 'unavailable'");
    expect(indicator).toContain('onMouseEnter=');
    expect(indicator).toContain('onFocusCapture=');
    expect(indicator).toContain('aria-live="polite"');
    expect(indicator).toContain('Workspace launch, owner login');
    expect(options).toContain('supabase.auth.getUser()');
    expect(options).toContain('getCoderLaunchConfig()');
    expect(indicator).not.toContain('CODER_API_TOKEN');
  });

  it('appears at the project IDE choice, its IDE action, and the WonderSpace launch button', () => {
    const dashboard = read('apps/web/app/(workspace)/dashboard/page.tsx');
    const launch = read('apps/web/components/engines/WonderSpaceLaunch.tsx');
    expect(dashboard).toContain('value === "workspace" ? <CoderAvailabilityIndicator');
    expect(dashboard).toContain('<CoderAvailabilityIndicator>');
    expect(launch).toContain('<CoderAvailabilityIndicator>');
    expect(launch).toContain("fetch('/api/user-workspace/provision'");
  });
});
