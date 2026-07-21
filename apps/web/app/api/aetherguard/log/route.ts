import { NextResponse } from 'next/server';
import { getAutoFixLog } from '@/core/aetherguard/autofix';
import { logger } from '@/lib/logger';

export async function GET() {
  return NextResponse.json({ entries: getAutoFixLog() });
}
