import { NextRequest, NextResponse } from 'next/server';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9][a-zA-Z0-9.-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9.-]{0,61}[a-zA-Z0-9])*$/;

function isValidEmail(email: string): boolean {
  if (email.length > 254 || email.length < 3) {
    return false;
  }
  
  return EMAIL_REGEX.test(email);
}

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Please use the login button to sign in with Replit.',
  }, { status: 400 });
}
