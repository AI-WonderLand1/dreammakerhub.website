import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';
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

type Target = { url: string } | { error: string; status: number; login?: boolean };

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

/** Returns ONLY the existing, verified operator workspace or editor URL. */
async function existingOperatorTarget(request: Request, bearerOnly: boolean): Promise<Target> {
  const supabase = await createClient();
  // POST requires the browser's own Supabase token. Never allow cookie-only
  // cross-site POSTs to start an operator workspace. No Coder token is exposed.
  const authorization = request.headers.get('authorization')?.trim() || '';
  const bearer = /^Bearer\s+(.+)$/i.exec(authorization)?.[1]?.trim();
  if (bearerOnly && !bearer) {
    return { error: 'Your DreamMakerHub session must be refreshed.', status: 401, login: true };
  }

  const { data: { user }, error } = bearerOnly
    ? await supabase.auth.getUser(bearer)
    : await supabase.auth.getUser();
  if (error || !user) {
    return { error: 'Your DreamMakerHub session must be refreshed.', status: 401, login: true };
  }

  if (!isConfiguredCoderOperator(user.id)) {
    return { error: 'Not found', status: 404 };
  }

  try {
    // Verify the server-side Coder token belongs to this operator before any
    // workspace action. Do not accept a workspace name, ID or URL from the browser.
    const identityResponse = await coderApiRequest('/api/v2/users/me', 'GET');
    if (!identityResponse.ok) {
      return { error: 'Coder owner verification failed.', status: 503 };
    }
    const identity = await identityResponse.json().catch(() => null) as CoderIdentity | null;
    if (!identity?.id || identity.username !== OPERATOR_CODER_USERNAME) {
      return { error: 'Coder owner does not match the private operator.', status: 503 };
    }

    const workspaceResponse = await coderApiRequest(
      `/api/v2/users/me/workspace/${encodeURIComponent(OPERATOR_WORKSPACE_NAME)}`,
      'GET',
    );
    if (!workspaceResponse.ok) {
      return { error: 'Existing production workspace was not found.', status: 503 };
    }
    const workspace = await workspaceResponse.json().catch(() => null) as CoderWorkspace | null;
    if (!workspace?.id ||
        workspace.name !== OPERATOR_WORKSPACE_NAME ||
        workspace.owner_id !== identity.id ||
        workspace.owner_name !== identity.username) {
      return { error: 'Coder workspace ownership check failed.', status: 503 };
    }

    const state = workspaceState(workspace);
    if (state === 'running') return { url: OPERATOR_IDE_URL };
    if (state === 'stopped') {
      // Starts the same workspace and reuses its existing persistent volume.
      const startResponse = await coderApiRequest(
        `/api/v2/workspaces/${encodeURIComponent(workspace.id)}/builds`,
        'POST',
        { transition: 'start' },
      );
      if (!startResponse.ok) {
        return { error: 'Coder did not accept the production workspace restart.', status: 502 };
      }
      return { url: OPERATOR_WORKSPACE_URL };
    }
    if (state === 'starting' || state === 'stopping') return { url: OPERATOR_WORKSPACE_URL };
    return { error: 'Coder production workspace needs attention before it can be opened.', status: 409 };
  } catch {
    return { error: 'Coder is unreachable or the server-side Coder connection is not configured.', status: 503 };
  }
}

export async function GET(request: Request) {
  const target = await existingOperatorTarget(request, false);
  if ('url' in target) {
    return NextResponse.redirect(target.url, { status: 303, headers: NO_STORE });
  }
  if (target.login) {
    // Keep the user on the real website login and return to WonderSpace after
    // sign-in. A Coder login is a separate session on a different origin.
    return NextResponse.redirect(new URL('/public-pages/auth?redirectTo=%2Fwonderspace', request.url), {
      status: 303,
      headers: NO_STORE,
    });
  }
  return NextResponse.json({ error: target.error }, { status: target.status, headers: NO_STORE });
}

export async function POST(request: Request) {
  const target = await existingOperatorTarget(request, true);
  if ('url' in target) {
    return NextResponse.json({ url: target.url }, { headers: NO_STORE });
  }
  return NextResponse.json({ error: target.error }, { status: target.status, headers: NO_STORE });
}
