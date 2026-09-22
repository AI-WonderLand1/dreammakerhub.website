import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { coderApiRequest } from '@/lib/coder/workspace-slots.server';

export const dynamic = 'force-dynamic';

const OPERATOR_CODER_USERNAME = 'wonderingtribe';
const OPERATOR_WORKSPACE_NAME = 'production';
const OPERATOR_WORKSPACE_URL = 'https://coder.dreammakerhub.website/@wonderingtribe/production';
const OPERATOR_IDE_URL = 'https://coder.dreammakerhub.website/@wonderingtribe/production.main/apps/code-server/?folder=/home/coder';
const NO_STORE = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

type CoderIdentity = {
  id?: string;
  username?: string;
};

type CoderWorkspace = {
  id?: string;
  name?: string;
  owner_id?: string;
  owner_name?: string;
  status?: string;
  latest_build?: {
    status?: string;
    transition?: string;
  };
};

function workspaceState(workspace: CoderWorkspace): 'running' | 'stopped' | 'starting' | 'stopping' | 'error' | 'unknown' {
  if (workspace.status === 'running' || workspace.status === 'stopped') return workspace.status;
  if (workspace.status === 'starting' || workspace.status === 'pending') return 'starting';
  if (workspace.status === 'stopping') return 'stopping';

  const buildStatus = workspace.latest_build?.status;
  const transition = workspace.latest_build?.transition;

  if (buildStatus === 'succeeded' && transition === 'start') return 'running';
  if (buildStatus === 'succeeded' && transition === 'stop') return 'stopped';
  if ((buildStatus === 'pending' || buildStatus === 'running') && transition === 'start') return 'starting';
  if ((buildStatus === 'pending' || buildStatus === 'running') && transition === 'stop') return 'stopping';
  if (buildStatus === 'failed' || buildStatus === 'canceled') return 'error';

  return 'unknown';
}

function redirectTo(url: string) {
  return NextResponse.redirect(url, { status: 303, headers: NO_STORE });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  if (!adminIds.includes(user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
  }

  try {
    // Verify that the server-side Coder token is still the operator before
    // touching the existing workspace. The token never leaves the server.
    const identityResponse = await coderApiRequest('/api/v2/users/me', 'GET');
    if (!identityResponse.ok) {
      return NextResponse.json({ error: 'Coder owner verification failed.' }, { status: 503, headers: NO_STORE });
    }
    const identity = await identityResponse.json().catch(() => null) as CoderIdentity | null;
    if (!identity?.id || identity.username !== OPERATOR_CODER_USERNAME) {
      return NextResponse.json({ error: 'Coder owner does not match the private operator.' }, { status: 503, headers: NO_STORE });
    }

    // Resolve the SAME existing workspace by Coder owner + name. Never create
    // a replacement workspace and never accept an ID or URL from the browser.
    const workspaceResponse = await coderApiRequest(
      `/api/v2/users/me/workspace/${encodeURIComponent(OPERATOR_WORKSPACE_NAME)}`,
      'GET',
    );
    if (!workspaceResponse.ok) {
      return NextResponse.json({ error: 'Existing production workspace was not found.' }, { status: 503, headers: NO_STORE });
    }

    const workspace = await workspaceResponse.json().catch(() => null) as CoderWorkspace | null;
    if (!workspace?.id ||
        workspace.name !== OPERATOR_WORKSPACE_NAME ||
        workspace.owner_id !== identity.id ||
        workspace.owner_name !== identity.username) {
      return NextResponse.json({ error: 'Coder workspace ownership check failed.' }, { status: 503, headers: NO_STORE });
    }

    const state = workspaceState(workspace);
    if (state === 'running') {
      return redirectTo(OPERATOR_IDE_URL);
    }

    if (state === 'stopped') {
      // Start the existing workspace and its existing PVC. This endpoint creates
      // a build transition only. It does not POST a new workspace.
      const startResponse = await coderApiRequest(
        `/api/v2/workspaces/${encodeURIComponent(workspace.id)}/builds`,
        'POST',
        { transition: 'start' },
      );
      if (!startResponse.ok) {
        return NextResponse.json({ error: 'Coder did not accept the production workspace restart.' }, { status: 502, headers: NO_STORE });
      }
      return redirectTo(OPERATOR_WORKSPACE_URL);
    }

    if (state === 'starting' || state === 'stopping') {
      return redirectTo(OPERATOR_WORKSPACE_URL);
    }

    return NextResponse.json(
      { error: 'Coder production workspace needs attention before it can be opened.' },
      { status: 409, headers: NO_STORE },
    );
  } catch {
    return NextResponse.json(
      { error: 'Coder is unreachable or the server-side Coder connection is not configured.' },
      { status: 503, headers: NO_STORE },
    );
  }
}
