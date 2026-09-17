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

const APP_SLUG_MAP: Record<string, string> = {
  ide: 'code-server',
  playcanvas: 'playcanvas',
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
  const podType = (body.podType as string) || 'ide';
  const cpu = Number(body.cpu) || 2;
  const memory = Number(body.memory) || 4;

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

  if (![1, 2, 3, 4].includes(cpu)) {
    return NextResponse.json({ error: 'CPU must be between 1 and 4 cores' }, { status: 400 });
  }

  if (![1, 2, 4, 8].includes(memory)) {
    return NextResponse.json({ error: 'Memory must be 1, 2, 4, or 8 GB' }, { status: 400 });
  }

  const templateId = TEMPLATE_MAP[podType];
  const appSlug = APP_SLUG_MAP[podType];
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
      userId: user.id,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    });

    if (!(await coder.healthCheck())) {
      return NextResponse.json(
        { error: 'WonderSpace cloud IDE is temporarily unavailable' },
        { status: 503 }
      );
    }

    const richParameterValues = [
      { name: 'cpu', value: String(cpu) },
      { name: 'memory', value: String(memory) },
      { name: 'home_disk_size', value: '20' },
    ];

    // Only the IDE template declares ssh_public_key. PlayCanvas uses Coder's
    // native workspace transport and should not receive an unknown parameter.
    if (podType === 'ide') {
      const sshKey = await getUserSSHKey(user.id, user.email || user.id);
      richParameterValues.push({ name: 'ssh_public_key', value: sshKey.publicKey });
    }

    const workspace = await coder.createWorkspace(user.id, {
      name: podName,
      template_id: templateId,
      rich_parameter_values: richParameterValues,
      ttl_ms: 4 * 60 * 60 * 1000,
    });

    // Path-based Coder apps are served beneath the workspace URL. Returning
    // this URL opens the actual code-server/PlayCanvas app instead of dropping
    // the user on Coder's workspace overview page.
    const workspaceUrl = workspace.url.replace(/\/$/, '');
    const ideUrl = `${workspaceUrl}/apps/${appSlug}/`;
    const sshCommand = `coder ssh ${workspace.name}`;

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to provision pod';
    logger.error('Pod provisioning failed:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
