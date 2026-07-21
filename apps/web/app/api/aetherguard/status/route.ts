import { NextResponse } from 'next/server';
import { getAetherGuardStatus } from '@/runners/aetherguardWorker';
import { logger } from '@/lib/logger';

export async function GET() {
  const status = getAetherGuardStatus();
  return NextResponse.json(status);
}
