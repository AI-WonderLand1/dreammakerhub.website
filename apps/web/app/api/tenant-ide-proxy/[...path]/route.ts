import { NextRequest, NextResponse } from 'next/server';

/**
 * Generic IDE Proxy for Coder sandboxes.
 * Replaces the old Theia-specific routing logic.
 */
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  // Logic to route to the individual Coder sandbox terminal/API
  return NextResponse.json({ status: 'Proxying to Coder instance', target: path });
}

export const runtime = 'edge';