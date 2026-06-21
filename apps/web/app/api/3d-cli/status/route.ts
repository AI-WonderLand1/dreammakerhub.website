import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simple health endpoint for the CLI system - just return status
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
