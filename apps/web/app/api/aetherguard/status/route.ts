import { NextResponse } from 'next/server';
import { getAetherGuardStatus } from '@runners/aetherguardWorker';

export async function GET() {
  const status = getAetherGuardStatus();
  return NextResponse.json(status);
}
