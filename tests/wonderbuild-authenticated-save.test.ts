import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchProject: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
}));

vi.mock('@/lib/wonderspace/browser-project-fetch', () => ({
  fetchAuthenticatedProject: mocks.fetchProject,
}));
vi.mock('@/lib/builder/store', () => ({
  useBuilderStore: { getState: mocks.getState, setState: mocks.setState },
}));

import { StorageService } from '../apps/web/lib/builder/pipeline/StorageService';

const projectState = {
  pages: [{ id: 'home', name: 'Home', slug: '/', elements: [] }],
  activePageId: 'home',
  elements: [],
  theme: {},
  activeBreakpoint: 'desktop',
  zoom: 1,
  pan: { x: 0, y: 0 },
  showGrid: true,
  snapToGrid: true,
};

describe('WonderBuild authenticated project persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getState.mockReturnValue(projectState);
    mocks.fetchProject.mockImplementation(async (_path: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? new Response('{}', { status: 200 })
        : new Response(JSON.stringify({ files: {} }), { status: 200 }),
    );
  });

  it('does not claim cloud save when the builder has no project', async () => {
    const storage = new StorageService();
    await expect(storage.saveToProject()).resolves.toBe(false);
    expect(mocks.fetchProject).not.toHaveBeenCalled();
  });

  it('loads and saves through the authenticated project-file API', async () => {
    const storage = new StorageService();
    storage.setProjectId('p1');
    await expect(storage.loadFromProject()).resolves.toBe(true);
    await expect(storage.saveToProject()).resolves.toBe(true);

    expect(mocks.fetchProject).toHaveBeenCalledWith('/api/projects/p1/files', { method: 'GET' });
    const saveCall = mocks.fetchProject.mock.calls.find(
      ([path, init]) => path === '/api/projects/p1/files' && init?.method === 'POST',
    );
    expect(saveCall).toBeDefined();
    const payload = JSON.parse(saveCall![1].body as string);
    expect(JSON.parse(payload.files['builder-state.json']).activePageId).toBe('home');
  });

  it('reports a rejected project write instead of success', async () => {
    mocks.fetchProject.mockImplementation(async (_path: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? new Response('save rejected', { status: 403 })
        : new Response(JSON.stringify({ files: {} }), { status: 200 }),
    );
    const storage = new StorageService();
    storage.setProjectId('p1');
    await storage.loadFromProject();
    await expect(storage.saveToProject()).resolves.toBe(false);
  });

  it('reports failed network writes instead of success', async () => {
    mocks.fetchProject.mockImplementation(async (_path: string, init?: RequestInit) => {
      if (init?.method === 'POST') throw new Error('Network unavailable');
      return new Response(JSON.stringify({ files: {} }), { status: 200 });
    });
    const storage = new StorageService();
    storage.setProjectId('p1');
    await storage.loadFromProject();
    await expect(storage.saveToProject()).resolves.toBe(false);
  });
});
