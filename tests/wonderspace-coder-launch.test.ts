import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCoderLaunchConfig, getCoderTemplateId, isSafeGithubBranch, normalizePublicGithubRepo } from '../apps/web/lib/coder/launch-options';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

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
    expect(route).toContain('new CoderAPIWrapper(');
    expect(route).toContain('coder.createWorkspace(');
    expect(route).toContain("getCoderTemplateId('playcanvas-3d')");
    expect(launch).toContain("fetch('/api/user-workspace/provision'");
    expect(read('apps/web/app/wonderspace/page.tsx')).toContain('WonderSpaceLaunch');
    expect(read('apps/web/components/engines/PodLauncher.tsx')).toContain('podType: PodType');
  });
  it('keeps repository selection visible but prevents launch when the template does not support it', () => {
    const launch = read('apps/web/components/engines/WonderSpaceLaunch.tsx');
    const route = read('apps/web/app/api/user-workspace/provision/route.ts');
    expect(launch).toContain("aria-pressed={mode === 'repo'}");
    expect(launch).toContain('mode === \'repo\' && !options.repositorySupported');
    expect(launch).toContain('options.regions.length ?');
    expect(route).toContain('if (!config.repositorySupported)');
    expect(route).toContain('getPublicGithubRepository(normalized)');
  });
  it('keeps the form visible during an outage, allows retry without resetting input, and gates provisioning', () => {
    const launch = read('apps/web/components/engines/WonderSpaceLaunch.tsx');
    expect(launch).toContain('Waiting for Coder connection');
    expect(launch).toContain('Retry Coder connection');
    expect(launch).toContain('setRetryCount((count) => count + 1)');
    expect(launch).toContain('aria-pressed={mode === \'blank\'}');
    expect(launch).toContain('disabled={!launchReady}');
    expect(launch).toContain('if (!options || optionsLoading || optionsError || !cpu || !memory)');
    expect(launch).toContain('disabled={!options}');
    expect(launch).not.toContain('window.location.reload()');
  });
  it('parses actual Coder template arrays and filters options to published capabilities', async () => {
    vi.stubEnv('CODER_API_URL', 'https://coder.example.test');
    vi.stubEnv('CODER_API_TOKEN', 'test-token');
    vi.stubEnv('CODER_IDE_TEMPLATE_NAME', 'kubernetes-mvp');
    const fetchMock = vi.fn(async (url: string) => {
      const body = url.endsWith('/api/v2/templates') ? [
        { id: 'coder-template-id', name: 'kubernetes-mvp', active_version_id: 'active-version' },
        { id: 'playcanvas-template-id', name: 'playcanvas-3d', active_version_id: 'playcanvas-version' },
      ] : [
        { name: 'cpu', options: [{ name: '2 CPUs', value: '2' }] },
        { name: 'memory', options: [{ name: '4 GB', value: '4' }] },
        { name: 'ssh_public_key' },
      ];
      return { ok: true, json: async () => body } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);
    const config = await getCoderLaunchConfig();
    expect(config.templateId).toBe('coder-template-id');
    expect(config.cpu).toEqual([{ label: '2 CPUs', value: '2' }]);
    expect(config.regions).toEqual([]);
    expect(config.repositorySupported).toBe(false);
    expect(await getCoderTemplateId('playcanvas-3d')).toBe('playcanvas-template-id');
    expect(fetchMock).toHaveBeenCalled();
  });
  it('does not read nonexistent linked repository columns from production projects', () => {
    expect(read('apps/web/app/api/user-workspace/options/route.ts')).not.toContain(".select('id,name,github_repo')");
  });
});
