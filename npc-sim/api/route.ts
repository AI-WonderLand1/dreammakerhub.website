import { NextResponse } from 'next/server';
import { runTick } from '@/lib/sim/tick';

// POST /api/sim/tick  { count?: number }
// Manual "step" button hits this with no body (defaults to 1 tick)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedCount = typeof body.count === 'number' ? body.count : 1;
    const count = Math.min(Math.max(requestedCount, 1), 100); // hard cap so a fat-fingered request can't lock up the DB

    let lastResult;
    for (let i = 0; i < count; i++) {
      lastResult = await runTick();
      if (lastResult.skipped) break; // world is paused
    }

    return NextResponse.json({ success: true, result: lastResult });
  } catch (err) {
    console.error('Tick error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
