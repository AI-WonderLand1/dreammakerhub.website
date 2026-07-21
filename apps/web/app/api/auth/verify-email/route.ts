import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Email verification is handled by Replit.' });
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Email verification is handled by Replit.' });
}
