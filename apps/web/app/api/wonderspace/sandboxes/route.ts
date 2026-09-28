import { NextResponse } from 'next/server';
import { customerSandboxRequest, PRIVATE_HEADERS, verifiedCustomerToken } from '@/lib/wonderspace/customer-sandbox-controller.server';

export const dynamic = 'force-dynamic';
async function forward(request: Request, method: 'GET' | 'POST') {
  const token = await verifiedCustomerToken(request);
  if (!token) return NextResponse.json({ error: 'DreamMakerHub login required.' }, { status: 401, headers: PRIVATE_HEADERS });
  try {
    const body = method === 'POST' ? await request.json().catch(() => null) : undefined;
    if (method === 'POST' && (!body || typeof body.name !== 'string' ||
        !/^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(body.name))) {
      return NextResponse.json({ error: 'Invalid workspace name.' }, { status: 400, headers: PRIVATE_HEADERS });
    }
    const result = await customerSandboxRequest(token, '', method, body);
    return NextResponse.json(result.data, { status: result.status, headers: PRIVATE_HEADERS });
  } catch {
    return NextResponse.json({ error: 'Customer IDE provisioning is unavailable.' }, { status: 503, headers: PRIVATE_HEADERS });
  }
}
export async function GET(request: Request) { return forward(request, 'GET'); }
export async function POST(request: Request) { return forward(request, 'POST'); }
