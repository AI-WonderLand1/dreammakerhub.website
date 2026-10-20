import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCoderLaunchConfig } from '../apps/web/lib/coder/launch-options';

const { coderFetchMock } = vi.hoisted(() => ({ coderFetchMock: vi.fn() }));
vi.mock('undici', () => ({ fetch: coderFetchMock }));

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); coderFetchMock.mockReset(); });

describe('Approved IDE images: discovery and provisioning', () => {
  it('exposes exactly the approved profile IDs published by Coder', async () => {
    vi.stubEnv('CODER_API_URL', 'https://coder.example.test');
    vi.stubEnv('CODER_API_TOKEN', 'test-token');
    vi.stubEnv('CODER_IDE_TEMPLATE_NAME', 'dreammakerhub-customer-ide');
    coderFetchMock.mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => url.endsWith('/api/v2/templates')
        ? [{ id: 'customer-template-id', name: 'dreammakerhub-customer-ide', active_version_id: 'active-version' }]
        : [
          { name: 'cpu', options: [{ name: '1 CPU', value: '1' }] },
          { name: 'memory', options: [{ name: '2 GiB', value: '2' }] },
          { name: 'ide_image', options: [
            { name: 'Linux / VS Code', value: 'linux' },
            { name: 'Web / Full Stack', value: 'web' },
            { name: 'Python / AI Development', value: 'python' },
            { name: 'Game / PlayCanvas WebGL', value: 'webgl' },
          ] },
        ],
    } as Response));
    const config = await getCoderLaunchConfig();
    expect(config.templateId).toBe('customer-template-id');
    expect(config.imageParameterSupported).toBe(true);
    expect(config.images).toEqual([
      { label: 'Linux / VS Code', value: 'linux' },
      { label: 'Web / Full Stack', value: 'web' },
      { label: 'Python / AI Development', value: 'python' },
      { label: 'Game / PlayCanvas WebGL', value: 'webgl' },
    ]);
  });

  it('rejects a published template with no approved images', async () => {
    vi.stubEnv('CODER_API_URL', 'https://coder.example.test');
    vi.stubEnv('CODER_API_TOKEN', 'test-token');
    vi.stubEnv('CODER_IDE_TEMPLATE_NAME', 'dreammakerhub-customer-ide');
    coderFetchMock.mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => url.endsWith('/api/v2/templates')
        ? [{ id: 'id', name: 'dreammakerhub-customer-ide', active_version_id: 'v1' }]
        : [
          { name: 'cpu', options: [{ value: '1' }] },
          { name: 'memory', options: [{ value: '2' }] },
          { name: 'ide_image', options: [{ value: 'some-user-image' }] },
        ],
    } as Response));
    await expect(getCoderLaunchConfig()).rejects.toThrow('unapproved IDE runtime profile');
  });

  it('rejects templates advertising arbitrary registry images, rather than silently filtering unsafe options', async () => {
    vi.stubEnv('CODER_API_URL', 'https://coder.example.test');
    vi.stubEnv('CODER_API_TOKEN', 'test-token');
    coderFetchMock.mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => url.endsWith('/api/v2/templates')
        ? [{ id: 'id', name: 'ai-wonderland-google', active_version_id: 'v1' }]
        : [{ name: 'ide_image', options: [
            { value: 'linux' },
            { value: 'docker.io/attacker/image:latest' },
          ] }],
    } as Response));
    await expect(getCoderLaunchConfig()).rejects.toThrow('unapproved IDE runtime profile');
  });

  it('keeps workspace images operator-controlled', () => {
    const route = read('apps/web/app/api/user-workspace/provision/route.ts');
    const template = read('infra/coder/template/main.tf');
    const launch = read('apps/web/components/engines/WonderSpaceLaunch.tsx');
    expect(route.indexOf('assertCoderOwnerIsolation(user.id);')).toBeLessThan(route.indexOf('await request.json()'));
    expect(route).toContain('This Coder template does not accept image overrides.');
    expect(route).not.toContain('body.imageUrl');
    expect(template).toContain('variable "workspace_image"');
    expect(template).toContain('WORKSPACE_IMAGE         = var.workspace_image');
    expect(template).toContain('ghcr.io/ai-wonderland1/ai-wonderland-coder-workspace:latest');
    expect(launch).toContain('Open project files');
  });
});
