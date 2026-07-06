import { NextResponse } from 'next/server';
import { getAutoFixLog } from '@/core/aetherguard/autofix';

export async function GET() {
  return NextResponse.json({ entries: getAutoFixLog() });
}
