import { NextResponse } from "next/server";
import { getProjectSSHKey } from "@/lib/workspace/provisioner";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const environmentId = searchParams.get('id');
  
  if (!environmentId) {
    return NextResponse.json({ error: 'Environment ID required' }, { status: 400 });
  }

  // TODO: Add authentication check - ensure user owns this environment
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
