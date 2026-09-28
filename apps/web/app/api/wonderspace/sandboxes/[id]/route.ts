import { NextResponse } from 'next/server';
import { customerSandboxRequest, PRIVATE_HEADERS, verifiedCustomerToken } from '@/lib/wonderspace/customer-sandbox-controller.server';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

async function forward(request: Request, context: Context, method: 'GET' | 'POST') {
  const token = await verifiedCustomerToken(request);
  if (!token) return NextResponse.json({ error: 'DreamMakerHub login required.' }, { status: 401, headers: PRIVATE_HEADERS });
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Workspace not found.' }, { status: 404, headers: PRIVATE_HEADERS });
  try {
    let path = '/' + id;
    if (method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body || !['start', 'stop', 'ticket'].includes(body.action)) {
        return NextResponse.json({ error: 'Invalid workspace action.' }, { status: 400, headers: PRIVATE_HEADERS });
      }
      path += '/' + body.action;
    }
    const result = await customerSandboxRequest(token, path, method);
    // Validate the link before allowing the browser to navigate to a VM.
    if (method === 'POST' && path.endsWith('/ticket') && result.status === 200) {
      const link = result.data.url;
      if (typeof link !== 'string') throw new Error('Invalid gateway address');
      const url = new URL(link);
      if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.up\.railway\.app$/i.test(url.hostname) ||
          url.pathname !== '/auth/start' || url.username || url.password || url.port) {
        throw new Error('Unexpected gateway address');
      }
    }
    return NextResponse.json(result.data, { status: result.status, headers: PRIVATE_HEADERS });
  } catch {
    return NextResponse.json({ error: 'Customer IDE action temporarily unavailable. Refresh workspace status before retrying.' }, {
      status: 503, headers: PRIVATE_HEADERS,
    });
  }
}
export async function GET(request: Request, context: Context) { return forward(request, context, 'GET'); }
export async function POST(request: Request, context: Context) { return forward(request, context, 'POST'); }
