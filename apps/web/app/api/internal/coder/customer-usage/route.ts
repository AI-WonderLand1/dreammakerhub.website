import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function authorized(request: Request): boolean {
  const expected = process.env.CODER_CUSTOMER_RUNNER_SECRET;
  const supplied = request.headers.get('authorization');
  if (!expected || expected.length < 32 || !supplied?.startsWith('Bearer ')) return false;
  const a = Buffer.from(supplied.slice(7));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Time-based IDE metering/stopping has been intentionally disabled.
  // Keep this authenticated endpoint returning 200 so any old scheduler/timer
  // is harmless until it is removed from infrastructure.
  return NextResponse.json(
    { status: 'disabled', timeLimits: false },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
