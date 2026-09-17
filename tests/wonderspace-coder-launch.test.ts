import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isSafeGithubBranch, normalizePublicGithubRepo } from '../apps/web/lib/coder/launch-options';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('WonderSpace public GitHub input safety', () => {
  it('accepts only public GitHub owner/repository URL shapes', () => {
    expect(normalizePublicGithubRepo('AI-WonderLand1/dreammakerhub.website')).toBe('AI-WonderLand1/dreammakerhub.website');
    expect(normalizePublicGithubRepo('https://github.com/example/project.git')).toBe('example/project');
    expect(normalizePublicGithubRepo('https://evil.example/owner/repo')).toBeNull();
    expect(normalizePublicGithubRepo('https://github.com@evil.example/owner/repo')).toBeNull();
    expect(normalizePublicGithubRepo('https://user:token@github.com/owner/repo')).toBeNull();
    expect(normalizePublicGithubRepo('https://github.com/owner/repo?token=secret')).toBeNull();
    expect(normalizePublicGithubRepo('owner/..')).toBeNull();
  });

  it('rejects unsafe ref names before branch selection is passed to Coder', () => {
    expect(isSafeGithubBranch('main')).toBe(true);
    expect(isSafeGithubBranch('feature/new-ui')).toBe(true);
    expect(isSafeGithubBranch('-c')).toBe(false);
    expect(isSafeGithubBranch('main..other')).toBe(false);
    expect(isSafeGithubBranch('a//b')).toBe(false);
    expect(isSafeGithubBranch('a.lock')).toBe(false);
    expect(isSafeGithubBranch('main;curl')).toBe(false);
  });
});

describe('Coder API remains the WonderSpace engine', () => {
  it('does not add a second workspace provider or alter the PlayCanvas launcher', () => {
    const route = read('apps/web/app/api/user-workspace/provision/route.ts');
    const launch = read('apps/web/components/engines/WonderSpaceLaunch.tsx');
    const page = read('apps/web/app/wonderspace/page.tsx');
    expect(route).toContain('new CoderAPIWrapper(');
    expect(route).toContain('coder.createWorkspace(');
    expect(launch).toContain("fetch('/api/user-workspace/provision'");
    expect(page).toContain('WonderSpaceLaunch');
    expect(read('apps/web/components/engines/PodLauncher.tsx')).toContain("podType: PodType");
  });

  it('never enables repository or region controls unsupported by Coder', () => {
    const launch = read('apps/web/components/engines/WonderSpaceLaunch.tsx');
    const route = read('apps/web/app/api/user-workspace/provision/route.ts');
    expect(launch).toContain('disabled={!options?.repositorySupported}');
    expect(launch).toContain('options.regions.length ?');
    expect(route).toContain('if (!config.repositorySupported)');
    expect(route).toContain('getPublicGithubRepository(normalized)');
  });
});
