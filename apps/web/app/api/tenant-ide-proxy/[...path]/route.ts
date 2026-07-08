import { NextRequest, NextResponse } from 'next/server';

const WORKSPACE_DOMAIN = process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN || process.env.WORKSPACE_DOMAIN || '';

// SECURITY: Only forward safe headers to upstream
const SAFE_UPSTREAM_HEADERS = ['authorization', 'content-type', 'accept'];

function sanitizePath(pathSegments: string[]): string {
  return pathSegments
    .filter(s => s && !s.includes('..') && !s.startsWith('.'))
    .join('/');
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = sanitizePath(params.path || []);

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = req.nextUrl.searchParams.get('workspace');
  if (!workspaceId) {
    return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
  }

  // Validate workspace ID format (alphanumeric + hyphens only)
  if (!/^[a-zA-Z0-9_-]+$/.test(workspaceId)) {
    return NextResponse.json({ error: 'Invalid workspace ID format' }, { status: 400 });
  }

  let targetHost: string;
  let targetPort: number;

  if (WORKSPACE_DOMAIN) {
    const subdomain = path.startsWith('playcanvas') ? `pc-${workspaceId}` :
                      path.startsWith('webgl') ? `ws-${workspaceId}` :
                      workspaceId;
    return NextResponse.redirect(`https://${subdomain}.${WORKSPACE_DOMAIN}/${path.replace(/^(playcanvas|webgl)\//, '')}`);
  }

  if (process.env.DOCKER_HOST || process.env.DOCKER_SOCKET) {
    const basePort = 10000 + hashCode(workspaceId) % 5000;
    targetPort = path.startsWith('playcanvas') ? basePort + 1 :
                 path.startsWith('webgl') ? basePort + 2 :
                 basePort;
    targetHost = 'localhost';
  } else {
    return NextResponse.json({
      status: 'not_configured',
      message: 'No workspace runtime configured. Set WORKSPACE_DOMAIN, DOCKER_HOST, or DOCKER_SOCKET.',
      path,
      workspaceId,
    });
  }

  try {
    const protocol = process.env.WORKSPACE_RUNTIME_PROTOCOL || 'http';
    const upstreamUrl = `${protocol}://${targetHost}:${targetPort}/${path}`;
    
    // SECURITY: Only forward safe headers, not all client headers
    const upstreamHeaders: Record<string, string> = {};
    for (const h of SAFE_UPSTREAM_HEADERS) {
      const val = req.headers.get(h);
      if (val) upstreamHeaders[h] = val;
    }
    
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: upstreamHeaders,
      method: 'GET',
    });

    const body = await upstreamResponse.arrayBuffer();
    return new NextResponse(body, {
      status: upstreamResponse.status,
      headers: Object.fromEntries(upstreamResponse.headers),
    });
  } catch {
    return NextResponse.json(
      { error: 'Workspace not reachable', workspaceId, path },
      { status: 502 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = sanitizePath(params.path || []);

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = req.nextUrl.searchParams.get('workspace');
  if (!workspaceId) {
    return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
  }

  // Validate workspace ID format
  if (!/^[a-zA-Z0-9_-]+$/.test(workspaceId)) {
    return NextResponse.json({ error: 'Invalid workspace ID format' }, { status: 400 });
  }

  if (WORKSPACE_DOMAIN) {
    const subdomain = path.startsWith('playcanvas') ? `pc-${workspaceId}` :
                      path.startsWith('webgl') ? `ws-${workspaceId}` :
                      workspaceId;
    return NextResponse.redirect(`https://${subdomain}.${WORKSPACE_DOMAIN}/${path.replace(/^(playcanvas|webgl)\//, '')}`);
  }

  if (!process.env.DOCKER_HOST && !process.env.DOCKER_SOCKET) {
    return NextResponse.json({
      status: 'not_configured',
      message: 'No workspace runtime configured.',
    });
  }

  const basePort = 10000 + hashCode(workspaceId) % 5000;
  const targetPort = path.startsWith('playcanvas') ? basePort + 1 :
                     path.startsWith('webgl') ? basePort + 2 :
                     basePort;

  try {
    const protocol = process.env.WORKSPACE_RUNTIME_PROTOCOL || 'http';
    const body = await req.arrayBuffer();
    
    // SECURITY: Only forward safe headers
    const upstreamHeaders: Record<string, string> = {};
    for (const h of SAFE_UPSTREAM_HEADERS) {
      const val = req.headers.get(h);
      if (val) upstreamHeaders[h] = val;
    }
    upstreamHeaders['content-type'] = req.headers.get('content-type') || 'application/json';
    
    const upstreamResponse = await fetch(`${protocol}://localhost:${targetPort}/${path}`, {
      method: 'POST',
      headers: upstreamHeaders,
      body,
    });

    const responseBody = await upstreamResponse.arrayBuffer();
    return new NextResponse(responseBody, {
      status: upstreamResponse.status,
      headers: Object.fromEntries(upstreamResponse.headers),
    });
  } catch {
    return NextResponse.json(
      { error: 'Workspace not reachable', workspaceId },
      { status: 502 }
    );
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}