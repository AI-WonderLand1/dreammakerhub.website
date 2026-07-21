import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/public-pages/auth', request.url));
}
