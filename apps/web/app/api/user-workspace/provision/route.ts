import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { CoderIntegration } from '@/lib/coder/integration';
import { getUserSSHKey } from '@/lib/coder/user-ssh-keys';

export const dynamic = 'force-dynamic';

const TEMPLATE_MAP: Record<string, string> = {
  ide: 'wonderspace-ide',
  playcanvas: 'playcanvas-3d',
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const podName = body.podName?.trim();
  const podType = body.podType as string || 'ide';
  const cpu = body.cpu as number || 2;
  const memory = body.memory as number || 4;

  if (!podName) {
    return NextResponse.json({ error: 'Pod name is required' }, { status: 400 });
  }

  if (!/^[a-z0-9][a-z0-9-]{1,60}[a-z0-9]$/.test(podName)) {
    return NextResponse.json(
      { error: 'Pod name must be 3-62 characters, lowercase alphanumeric and hyphens only' },
      { status: 400 }
    );
  }

  if (podType !== 'ide' && podType !== 'playcanvas') {
    return NextResponse.json(
      { error: 'podType must be "ide" or "playcanvas"' },
      { status: 400 }
    );
  }

  const templateId = TEMPLATE_MAP[podType];

  try {
    const sshKey = await getUserSSHKey(user.id, user.email || user.id);

    const coder = new CoderIntegration();
    const { workspace, ideUrl } = await coder.provisionIDEForProject(
      user.id,
      podName,
      undefined,
      {
        customName: podName,
        sshPublicKey: sshKey.publicKey,
        templateId,
        cpu,
        memory,
      }
    );

    const sshCommand = `ssh coder@${new URL(ideUrl).hostname}`;

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        status: workspace.status,
      },
      ideUrl,
      podUrl: ideUrl,
      sshCommand,
      podType,
    });
  } catch (error: any) {
    console.error('Pod provisioning failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to provision pod' },
      { status: 500 }
    );
  }
}
