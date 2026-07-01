import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { CoderIntegration } from '@/lib/coder/integration';
import { getUserSSHKey } from '@/lib/coder/user-ssh-keys';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const podName = body.podName?.trim();

  if (!podName) {
    return NextResponse.json({ error: 'Pod name is required' }, { status: 400 });
  }

  // Validate pod name (lowercase alphanumeric + hyphens, 3-62 chars)
  if (!/^[a-z0-9][a-z0-9-]{1,60}[a-z0-9]$/.test(podName)) {
    return NextResponse.json(
      { error: 'Pod name must be 3-62 characters, lowercase alphanumeric and hyphens only' },
      { status: 400 }
    );
  }

  try {
    // Get or generate user's SSH key (tied to profile + unique ID)
    const sshKey = await getUserSSHKey(user.id, user.email || user.id);

    // Provision workspace with custom name and SSH key
    const coder = new CoderIntegration();
    const { workspace, ideUrl } = await coder.provisionIDEForProject(
      user.id,
      podName,
      undefined,
      { customName: podName, sshPublicKey: sshKey.publicKey }
    );

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        status: workspace.status,
      },
      ideUrl,
    });
  } catch (error: any) {
    console.error('IDE provisioning failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to provision IDE workspace' },
      { status: 500 }
    );
  }
}
