import { NextResponse } from "next/server";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({ error: "SSH exec disabled" }, { status: 403 });
}
