import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/lib/db', () => ({ query: mocks.query }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
vi.mock('@/lib/builder/components/PublishedBuilderPage', () => ({ default: () => null }));
import Page, { generateMetadata } from '../apps/web/app/(public)/sites/[projectId]/[[...slug]]/page';

beforeEach(() => vi.clearAllMocks());

describe('public WonderBuild project lookup', () => {
  it('uses canonical project ownership and resolves the requested subpage', async () => {
    mocks.query.mockResolvedValue({ rows: [{ title: 'About', content: {
      kind: 'wonderbuild-site-page', wonderBuild: { projectId: 'p1', pageSlug: 'about' }, elements: [],
    } }] });
    expect(await generateMetadata({ params: Promise.resolve({ projectId: 'p1', slug: ['about'] }) })).toMatchObject({ title: 'About' });
    const [sql, parameters] = mocks.query.mock.calls[0];
    expect(sql).toContain('INNER JOIN _projects pr');
    // _projects.owner_id is TEXT; pages.user_id is UUID.
    expect(sql).toContain('pr.owner_id = pg.user_id::text');
    expect(sql).toContain('pg.published = true');
    expect(parameters).toEqual(['p1', 'about']);
  });

  it('returns not found when no owned, published page matches', async () => {
    mocks.query.mockResolvedValue({ rows: [] });
    await expect(Page({ params: Promise.resolve({ projectId: 'p1' }) })).rejects.toThrow('NOT_FOUND');
    expect(mocks.query.mock.calls[0][1]).toEqual(['p1', '/']);
  });

  it('does not render malformed published content', async () => {
    mocks.query.mockResolvedValue({ rows: [{ title: 'Invalid', content: { kind: 'other' } }] });
    await expect(Page({ params: Promise.resolve({ projectId: 'p1' }) })).rejects.toThrow('NOT_FOUND');
  });
});
