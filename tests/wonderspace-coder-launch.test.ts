import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCoderLaunchConfig, getCoderTemplateId, isSafeGithubBranch, normalizePublicGithubRepo } from '../apps/web/lib/coder/launch-options';

const { coderFetchMock } = vi.hoisted(() => ({ coderFetchMock: vi.fn() }));
vi.mock('undici', () => ({ fetch: coderFetchMock }));

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); coderFetchMock.mockReset(); });

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
    expect(launch).toContain("fetch('/api/user-workspace/customer/provision'");
    const page = read('apps/web/app/wonderspace/page.tsx');
    const operatorGate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
    // The page separates the existing operator IDE from the customer launcher.
    // Customer provisioning is deliberately unavailable until the pilot is enabled.
    expect(page).toContain('WonderSpaceOperatorGate');
    expect(operatorGate).toContain('<OperatorIdePanel />');
    expect(operatorGate).not.toContain('CustomerSandboxIdeEntry');
    expect(operatorGate).not.toContain('CustomerWorkspaceLaunch');
    expect(operatorGate).toContain('AI WONDERLAND project files');
    expect(operatorGate).toContain('Open project files');
    expect(read('apps/web/components/engines/PodLauncher.tsx')).toContain('podType: PodType');
  });
  it('uses first-party AI WONDERLAND projects instead of GitHub repositories in the customer IDE launcher', () => {
    const launch = read('apps/web/components/engines/WonderSpaceLaunch.tsx');
    expect(launch).toContain('id="workspace-source"');
    expect(launch).toContain('Current AI WONDERLAND project');
    expect(launch).toContain("projectId: mode === 'site' ? projectId : null");
    expect(launch).not.toContain('Public GitHub repository');
    expect(launch).not.toContain('Checking GitHub');
    expect(launch).not.toContain('/api/user-workspace/repository');
  });
  it('keeps the form visible, retries outages, and shows concrete live readiness blockers', () => {
    const launch = read('apps/web/components/engines/WonderSpaceLaunch.tsx');
    expect(launch).toContain('Coder connected · setup still required');
    expect(launch).toContain('Retry');
    expect(launch).toContain('setRetryCount((count) => count + 1)');
    expect(launch).toContain('options.blockers.map');
    expect(launch).toContain('<option value="blank">Blank workspace</option>');
    expect(launch).toContain('disabled={!launchReady}');
    expect(launch).toContain('options.ready');
    expect(launch).toContain('Existing Coder cluster');
    const optionsRoute = read('apps/web/app/api/user-workspace/options/route.ts');
    expect(optionsRoute).toContain("code: 'CODER_OIDC_REQUIRED'");
    expect(optionsRoute).not.toContain("code: 'COMPUTE_CONTROLLER_REQUIRED'");
    expect(optionsRoute).toContain('customerProvisioningGate()');
    expect(optionsRoute).toContain('verifiedCustomerTemplate()');
    expect(optionsRoute).not.toContain('CUSTOMER_IDE_PAUSED');
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
    coderFetchMock.mockImplementation(fetchMock);
    const config = await getCoderLaunchConfig();
    expect(config.templateId).toBe('coder-template-id');
    expect(config.cpu).toEqual([{ label: '2 CPUs', value: '2' }]);
    expect(config.machineProfiles).toEqual([]);
    expect(config.regions).toEqual([]);
    expect(config.repositorySupported).toBe(false);
    expect(await getCoderTemplateId('playcanvas-3d')).toBe('playcanvas-template-id');
    expect(coderFetchMock).toHaveBeenCalled();
  });
  it('recognizes the published AI WONDERLAND Google Docker template when no override is set', async () => {
    vi.stubEnv('CODER_API_URL', 'https://coder.example.test');
    vi.stubEnv('CODER_API_TOKEN', 'test-token');
    vi.stubEnv('CODER_IDE_TEMPLATE_NAME', '');
    coderFetchMock.mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => url.endsWith('/api/v2/templates')
        ? [{ id: 'live-template-id', name: 'ai-wonderland-google', active_version_id: 'live-version' }]
        : [],
    } as Response));
    const config = await getCoderLaunchConfig();
    expect(config.templateId).toBe('live-template-id');
    expect(config.templateName).toBe('ai-wonderland-google');
    expect(config.templateVersionId).toBe('live-version');
    expect(config.machineProfiles).toEqual([]);
    expect(config.cpu).toEqual([]);
    expect(config.memory).toEqual([]);
    expect(config.regions).toEqual([]);
  });
  it('does not read nonexistent linked repository columns from production projects', () => {
    expect(read('apps/web/app/api/user-workspace/options/route.ts')).not.toContain(".select('id,name,github_repo')");
  });
});
