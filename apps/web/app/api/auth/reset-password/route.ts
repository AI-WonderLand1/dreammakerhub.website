import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Password reset is handled by Replit.' });
}

export async function PUT(_request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Password update is handled by Replit.' });
}
