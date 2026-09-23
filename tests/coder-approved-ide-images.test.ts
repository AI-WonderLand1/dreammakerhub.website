import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCoderLaunchConfig } from '../apps/web/lib/coder/launch-options';

const { coderFetchMock } = vi.hoisted(() => ({ coderFetchMock: vi.fn() }));
vi.mock('undici', () => ({ fetch: coderFetchMock }));

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); coderFetchMock.mockReset(); });

describe('Approved IDE images: discovery and provisioning', () => {
  it('shows only admin-approved profiles from the published Coder template', async () => {
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
            { name: 'Node.js / VS Code', value: 'node' },
            { name: 'User-controlled image', value: 'docker.io/attacker/ide:latest' },
          ] },
        ],
    } as Response));
    const config = await getCoderLaunchConfig();
    expect(config.templateId).toBe('customer-template-id');
    expect(config.images).toEqual([
      { label: 'Linux / VS Code', value: 'linux' },
      { label: 'Node.js / VS Code', value: 'node' },
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
    await expect(getCoderLaunchConfig()).rejects.toThrow('no approved IDE image profiles');
  });

  it('never creates a workspace from a browser-supplied image URL or shared customer owner', () => {
    const route = read('apps/web/app/api/user-workspace/provision/route.ts');
    const template = read('infra/coder/customer-template/main.tf');
    const launch = read('apps/web/components/engines/WonderSpaceLaunch.tsx');
    expect(route.indexOf('assertCoderOwnerIsolation(user.id);')).toBeLessThan(route.indexOf('await request.json()'));
    expect(route).toContain("name: 'ide_image', value: imageProfile");
    expect(route).toContain('config.images.some((option) => option.value === imageProfile)');
    expect(route).not.toContain('body.imageUrl');
    expect(template).toContain('local.images[data.coder_parameter.ide_image.value]');
    expect(template).toContain('share        = "owner"');
    expect(template).toContain('automount_service_account_token = false');
    expect(launch).toContain('options.images.map(');
    expect(launch).toContain('ideImage');
    expect(launch).toContain('Open an existing IDE instead');
  });
});
