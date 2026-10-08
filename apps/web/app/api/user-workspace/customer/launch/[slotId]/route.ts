import { NextResponse } from 'next/server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { coderApiRequest } from '@/lib/coder/workspace-slots.server';
import {
  CUSTOMER_WORKSPACE_UUID,
  codeServerUrl,
  verifiedCustomerWorkspace,
  workspaceState,
} from '@/lib/coder/customer-workspace-access.server';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ slotId: string }> };

function waitingPage(message: string): Response {
  const safeMessage = message.replace(/[<>&"']/g, '');
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="2">
    <title>Opening WonderSpace</title>
    <style>
      html,body{height:100%;margin:0;background:#090d1d;color:#e2e8f0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      body{display:grid;place-items:center}
      main{max-width:32rem;padding:2rem;text-align:center}
      h1{margin:0 0 .75rem;font-size:1.5rem}
      p{margin:0;color:#94a3b8}
    </style>
  </head>
  <body>
    <main>
      <h1>Opening WonderSpace…</h1>
      <p>${safeMessage}</p>
    </main>
  </body>
</html>`,
    {
      status: 202,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'Referrer-Policy': 'no-referrer',
        'Refresh': '2',
      },
    },
  );
}

export async function GET(request: Request, { params }: Context) {
  const { slotId } = await params;
  if (!CUSTOMER_WORKSPACE_UUID.test(slotId)) {
    return NextResponse.json(
      { error: 'Workspace not found' },
      { status: 404, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  try {
    const workspace = await verifiedCustomerWorkspace(request, slotId);
    const state = workspaceState(workspace);

    if (state === 'running') {
      const url = codeServerUrl(workspace);
      if (!url) return waitingPage('The IDE application is still registering with Coder.');

      const response = NextResponse.redirect(url, 307);
      response.headers.set('Cache-Control', 'private, no-store');
      response.headers.set('Referrer-Policy', 'no-referrer');
      return response;
    }

    if (state === 'stopped') {
      const started = await coderApiRequest(
        `/api/v2/workspaces/${encodeURIComponent(workspace.id!)}/builds`,
        'POST',
        { transition: 'start' },
      );
      if (!started.ok && started.status !== 409) {
        throw new CostGateError('Coder did not accept the workspace restart.');
      }
      return waitingPage('Starting your private workspace. This page will continue automatically.');
    }

    if (['pending', 'starting', 'stopping', 'canceling'].includes(state)) {
      return waitingPage('Coder is finishing the workspace transition.');
    }

    return NextResponse.json(
      { error: `Coder reports workspace state ${state}.` },
      { status: 409, headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (cause) {
    return costGateResponse(cause instanceof CostGateError ? cause : undefined);
  }
}
