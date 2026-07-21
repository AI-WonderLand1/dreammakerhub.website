import { NextRequest, NextResponse } from "next/server";
import { getProjectSSHKey } from "@/lib/workspace/provisioner";
import { requirePaidAIUser } from "@/app/api/ai/auth";
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requirePaidAIUser(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const environmentId = searchParams.get('id');
  
  if (!environmentId) {
    return NextResponse.json({ error: 'Environment ID required' }, { status: 400 });
  }

  const privateKey = await getProjectSSHKey(environmentId);
  
  if (!privateKey) {
    return NextResponse.json({ error: 'SSH key not found' }, { status: 404 });
  }

  return new NextResponse(privateKey, {
    headers: {
      'Content-Type': 'application/x-pem-file',
      'Content-Disposition': `attachment; filename="${environmentId}_ssh_key.pem"`,
    },
  });
}
