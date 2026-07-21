import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  return NextResponse.json({ success: false, error: 'Use Replit login' }, { status: 401 });
}
