import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { CoderAPIWrapper } from '@/lib/coder/api-wrapper';
import { getUserSSHKey } from '@/lib/coder/user-ssh-keys';
import { logger } from '@/lib/logger';

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

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const podName = body.podName?.trim();
  const podType = body.podType as string || 'ide';
  const cpu = body.cpu as number || 2;
  const memory = body.memory as number || 4;

  if (!podName) {
    return NextResponse.json({ error: 'Pod name is required' }, { status: 400 });
  }

  if (!/^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(podName)) {
    return NextResponse.json(
      { error: 'Pod name must be 3-32 characters, lowercase alphanumeric and hyphens only' },
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
  const coderApiUrl = process.env.CODER_API_URL;
  const coderApiToken = process.env.CODER_API_TOKEN;

  if (!coderApiUrl || !coderApiToken) {
    return NextResponse.json(
      { error: 'WonderSpace cloud IDE is not configured on the server' },
      { status: 503 }
    );
  }

  try {
    const coder = new CoderAPIWrapper({
      apiUrl: coderApiUrl,
      apiKey: coderApiToken,
    });

    if (!(await coder.healthCheck())) {
      return NextResponse.json(
        { error: 'WonderSpace cloud IDE is temporarily unavailable' },
        { status: 503 }
      );
    }

    const sshKey = await getUserSSHKey(user.id, user.email || user.id);
    
    const { workspace, ideUrl } = await coder.createWorkspaceForApp(
      user.id,
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
    logger.error('Pod provisioning failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to provision pod' },
      { status: 500 }
    );
  }
}
