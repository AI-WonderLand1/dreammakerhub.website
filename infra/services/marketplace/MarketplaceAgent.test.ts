import { beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';

const { git, repos } = vi.hoisted(() => ({
  git: { getRef: vi.fn(), getTree: vi.fn(), getBlob: vi.fn() },
  repos: { getReleaseByTag: vi.fn(), getCommit: vi.fn() },
}));

vi.mock('@octokit/rest', () => ({
  Octokit: class {
    git = git;
    repos = repos;
  },
}));

import { MarketplaceAgent } from './MarketplaceAgent';

const packageId = 'github:owner/repo';

beforeEach(() => {
  vi.resetAllMocks();
  git.getRef.mockResolvedValue({ data: { object: { sha: 'commit-sha' } } });
});

describe('MarketplaceAgent', () => {
  it('rejects missing package IDs', async () => {
    expect(await MarketplaceAgent.install({ packageId: '' })).toMatchObject({ ok: false, installed: false });
  });

  it('does not claim a stubbed local install succeeded', async () => {
    expect(await MarketplaceAgent.install({ packageId: 'local-pkg', source: 'local' })).toMatchObject({
      ok: false,
      installed: false,
    });
    expect(git.getRef).not.toHaveBeenCalled();
  });

  it('rejects malformed GitHub package names', async () => {
    expect(await MarketplaceAgent.install({ packageId: 'bad-id', source: 'github' })).toMatchObject({
      ok: false,
      installed: false,
    });
    expect(git.getRef).not.toHaveBeenCalled();
  });

  it('fails closed on a truncated GitHub tree', async () => {
    git.getTree.mockResolvedValue({ data: { truncated: true, tree: [] } });
    expect(await MarketplaceAgent.install({ packageId })).toMatchObject({ ok: false, installed: false });
    expect(git.getBlob).not.toHaveBeenCalled();
  });

  it('rejects packages exceeding the 100-file limit rather than returning a partial ZIP', async () => {
    git.getTree.mockResolvedValue({
      data: {
        truncated: false,
        tree: Array.from({ length: 101 }, (_, i) => ({ type: 'blob', path: `${i}.txt`, sha: `sha-${i}` })),
      },
    });
    const result = await MarketplaceAgent.install({ packageId });
    expect(result).toMatchObject({ ok: false, installed: false });
    expect(result.files).toBeUndefined();
    expect(git.getBlob).not.toHaveBeenCalled();
  });

  it('does not return a ZIP when a blob fetch fails', async () => {
    git.getTree.mockResolvedValue({
      data: { truncated: false, tree: [{ type: 'blob', path: 'a.txt', sha: 'sha-a' }] },
    });
    git.getBlob.mockRejectedValue(new Error('fetch failed'));
    const result = await MarketplaceAgent.install({ packageId });
    expect(result).toMatchObject({ ok: false, installed: false });
    expect(result.files).toBeUndefined();
  });

  it('returns a complete prepared archive but never claims the package is installed', async () => {
    git.getTree.mockResolvedValue({
      data: { truncated: false, tree: [{ type: 'blob', path: 'hello.txt', sha: 'sha-a' }] },
    });
    git.getBlob.mockResolvedValue({ data: { content: Buffer.from('hello').toString('base64'), encoding: 'base64' } });
    const result = await MarketplaceAgent.install({ packageId });
    expect(result).toMatchObject({ ok: true, installed: false });
    expect(result.files?.[0].path).toBe('package.zip');
    const zip = await JSZip.loadAsync(Buffer.from(result.files![0].content, 'base64'));
    expect(await zip.file('hello.txt')!.async('string')).toBe('hello');
  });
});
