/**
 * Reject ambiguous responses before opening an authenticated WonderBuild project.
 * A successful HTTP status alone is not evidence that the requested project loaded.
 */
export type BuilderProjectStatus = 'loading' | 'ready' | 'signin' | 'forbidden' | 'notfound' | 'unavailable';

export type BuilderProjectAccess =
  | { status: 'ready'; ownerId: string }
  | { status: Exclude<BuilderProjectStatus, 'loading' | 'ready'> };

export async function checkBuilderProjectAccess(
  projectId: string,
  request: () => Promise<Response>,
): Promise<BuilderProjectAccess> {
  try {
    const response = await request();
    if (response.status === 401) return { status: 'signin' };
    if (response.status === 403) return { status: 'forbidden' };
    if (response.status === 404) return { status: 'notfound' };
    if (!response.ok) return { status: 'unavailable' };

    const body: unknown = await response.json();
    if (!body || typeof body !== 'object') return { status: 'unavailable' };
    const payload = body as { ok?: unknown; project?: { id?: unknown; ownerId?: unknown } };
    if (
      payload.ok !== true ||
      !payload.project ||
      payload.project.id !== projectId ||
      typeof payload.project.ownerId !== 'string' ||
      payload.project.ownerId.length === 0
    ) {
      return { status: 'unavailable' };
    }

    return { status: 'ready', ownerId: payload.project.ownerId };
  } catch {
    // Network errors and malformed responses must never unlock the editor.
    return { status: 'unavailable' };
  }
}
