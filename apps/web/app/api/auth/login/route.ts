import { NextRequest, NextResponse } from 'next/server';

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  return NextResponse.redirect(new URL('/api/auth/replit-login', _request.url));
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/api/auth/replit-login', request.url));
}
