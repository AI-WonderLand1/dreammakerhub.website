import { NextRequest, NextResponse } from 'next/server';

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Please use the login button to sign in with Replit.',
  }, { status: 400 });
}
