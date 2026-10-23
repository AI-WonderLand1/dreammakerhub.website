import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), client: vi.fn() }));
vi.mock('next/server', () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }));
vi.mock('@/app/api/ai/auth', () => ({ requirePaidAIUser: mocks.auth }));
vi.mock('@/lib/projects/storage', () => ({ getProjectStorageClient: mocks.client }));
vi.mock('@/lib/security/sanitize-html.server', () => ({ sanitizeUntrustedHtml: (html: string) => html }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
import { POST } from '../apps/web/app/api/projects/publish/route';

const owner = '00000000-0000-4000-8000-000000000001';
const projectId = '00000000-0000-4000-8000-000000000002';
const pages = [
  { id: 'home', name: 'Home', slug: '/', elements: [] },
  { id: 'about', name: 'About', slug: 'about', elements: [] },
];
const request = () => new Request('https://example.com/api/projects/publish', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ target: 'site', projectId, pages }),
}) as NextRequest;

function database(projectOwner: string | null = owner, writeError: unknown = null) {
  const filters: Record<string, string> = {};
  const projectQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn((key: string, value: string) => { filters[key] = value; return projectQuery; }),
    maybeSingle: vi.fn(async () => ({
      data: projectOwner && filters.id === projectId && filters.owner_id === projectOwner
        ? { id: projectId, owner_id: projectOwner } : null,
      error: null,
    })),
  };
  const previous = [{ id: 'old', slug: `wb-${owner}-${projectId}-removed` }];
  const pageQuery = {
    upsert: vi.fn().mockResolvedValue({ error: writeError }),
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    like: vi.fn().mockResolvedValue({ data: previous, error: null }),
    delete: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ error: null }),
  };
  const client = { from: vi.fn((table: string) => {
    if (table === '_projects') return projectQuery;
    if (table === 'pages') return pageQuery;
    throw new Error(`Unexpected table: ${table}`);
  }) };
  mocks.client.mockResolvedValue(client);
  return { client, pageQuery, projectQuery };
}

beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ userId: owner }); });

describe('WonderBuild publishing from canonical project storage', () => {
  it('publishes a multi-page project existing only in _projects and removes stale pages', async () => {
    const { pageQuery } = database();
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, url: `/sites/${projectId}`, pages: [
      { url: `/sites/${projectId}` }, { url: `/sites/${projectId}/about` },
    ] });
    const rows = pageQuery.upsert.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ user_id: owner, published: true,
      content: { wonderBuild: { projectId, pageSlug: 'about' } } });
    expect(pageQuery.eq).toHaveBeenCalledWith('user_id', owner);
    expect(pageQuery.in).toHaveBeenCalledWith('id', ['old']);
  });

  it.each([null, '00000000-0000-4000-8000-000000000003'])('rejects missing or other-owner projects (%s)', async projectOwner => {
    const { pageQuery } = database(projectOwner);
    expect((await POST(request())).status).toBe(404);
    expect(pageQuery.upsert).not.toHaveBeenCalled();
  });

  it('rejects anonymous requests before database access', async () => {
    mocks.auth.mockResolvedValue(Response.json({ ok: false }, { status: 401 }));
    expect((await POST(request())).status).toBe(401);
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it('does not report publication success or delete old pages when the write fails', async () => {
    const { pageQuery } = database(owner, new Error('Database unavailable'));
    expect((await POST(request())).status).toBe(500);
    expect(pageQuery.delete).not.toHaveBeenCalled();
  });
});
