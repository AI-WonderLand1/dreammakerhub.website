import { describe, expect, it } from 'vitest';
import { checkBuilderProjectAccess } from '../apps/web/lib/builder/project-access';

const projectId = 'a-project-id';
const reply = (status: number, payload: unknown = {}) =>
  Promise.resolve(new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }));

describe('WonderBuild authenticated project access gate', () => {
  it('opens only the requested project with a verified owner in a successful API response', async () => {
    expect(await checkBuilderProjectAccess(projectId, () =>
      reply(200, { ok: true, project: { id: projectId, ownerId: 'owner-one' } }),
    )).toEqual({ status: 'ready', ownerId: 'owner-one' });
  });

  it.each([
    [401, 'signin'],
    [403, 'forbidden'],
    [404, 'notfound'],
    [429, 'unavailable'],
    [500, 'unavailable'],
    [503, 'unavailable'],
  ] as const)('does not open the editor for HTTP %i', async (httpCode, expected) => {
    expect(await checkBuilderProjectAccess(projectId, () => reply(httpCode))).toEqual({ status: expected });
  });

  it.each([
    { ok: false, project: { id: projectId, ownerId: 'owner-one' } },
    { ok: true, project: { id: 'some-other-project', ownerId: 'owner-one' } },
    { ok: true, project: { id: projectId } },
    { ok: true, project: { id: projectId, ownerId: '' } },
    { ok: true },
    null,
  ])('rejects a malformed or mismatched success payload', async (payload) => {
    expect(await checkBuilderProjectAccess(projectId, () => reply(200, payload))).toEqual({ status: 'unavailable' });
  });

  it('does not open when the request fails or JSON cannot be parsed', async () => {
    expect(await checkBuilderProjectAccess(projectId, async () => {
      throw new TypeError('Failed to fetch');
    })).toEqual({ status: 'unavailable' });
    expect(await checkBuilderProjectAccess(projectId, () =>
      Promise.resolve(new Response('not-json', { status: 200 })),
    )).toEqual({ status: 'unavailable' });
  });
});
