// app/api/github/webhook/route.ts
import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

function verifySignature(rawBody: string, signatureHeader: string | null) {
  if (!signatureHeader) return false;
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

async function handlePushEvent(payload: any) {
  console.info('[github:webhook] push', {
    ref: payload?.ref,
    repository: payload?.repository?.full_name,
    after: payload?.after,
  });
}

async function handlePullRequestEvent(payload: any) {
  console.info('[github:webhook] pull_request', {
    action: payload?.action,
    repository: payload?.repository?.full_name,
    number: payload?.number,
  });

  return NextResponse.json({ ok: true, action: payload?.action ?? 'unknown' }, { status: 200 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: any = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const event = request.headers.get('x-github-event');

  switch (event) {
    case 'push':
      await handlePushEvent(payload);
      break;
    case 'pull_request':
      return handlePullRequestEvent(payload);
    default:
      console.info('[github:webhook] ignored', { event });
      break;
  }

  return NextResponse.json({ success: true });
}
