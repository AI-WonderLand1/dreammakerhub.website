import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { CoderAPIWrapper } from '@/lib/coder/api-wrapper';
import { getUserSSHKey } from '@/lib/coder/user-ssh-keys';
import { getCoderLaunchConfig, getCoderTemplateId, getPublicGithubRepository, isSafeGithubBranch, normalizePublicGithubRepo } from '@/lib/coder/launch-options';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { assertCoderOwnerIsolation, assertCoderResourceBudget, attachCoderWorkspace, CODER_DISK_GIB, CODER_TTL_MS, coderApiConfig, reserveCoderSlot } from '@/lib/coder/workspace-slots.server';
import { trackFunnelEvent } from '@/lib/analytics/track-funnel-event.server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
const APP_SLUG_MAP = { ide: 'code-server', playcanvas: 'playcanvas' } as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // The configured server token currently acts as ONE Coder owner. Reject other
  // site users before parsing options or contacting that shared Coder account.
  // Keep the independent check in reserveCoderSlot as defense in depth.
  try {
    assertCoderOwnerIsolation(user.id);
  } catch (error) {
    return costGateResponse(error instanceof CostGateError ? error : undefined);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const podName = typeof body.podName === 'string' ? body.podName.trim() : '';
  const podType = body.podType || 'ide';
  const cpu = body.cpu === undefined ? 2 : Number(body.cpu);
  const memory = body.memory === undefined ? 4 : Number(body.memory);
  if (!/^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(podName)) {
    return NextResponse.json({ error: 'Workspace name must be 3-32 lowercase letters, numbers, or hyphens.' }, { status: 400 });
  }
  if (podType !== 'ide' && podType !== 'playcanvas') {
    return NextResponse.json({ error: 'Unsupported workspace type.' }, { status: 400 });
  }
  try {
    // Validate size and URL BEFORE any Coder token is sent or a slot is acquired.
    assertCoderResourceBudget(cpu, memory);
    const connection = coderApiConfig();
    const coder = new CoderAPIWrapper({
      apiUrl: connection.url,
      apiKey: connection.token,
      userId: user.id,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    });
    if (!(await coder.healthCheck())) {
      return NextResponse.json({ error: 'WonderSpace cloud IDE is temporarily unavailable.' }, { status: 503 });
    }
    const richParameterValues: { name: string; value: string }[] = [
      { name: 'cpu', value: String(cpu) },
      { name: 'memory', value: String(memory) },
    ];
    let templateId: string;
    if (podType === 'ide') {
      let config;
      try { config = await getCoderLaunchConfig(); } catch {
        return NextResponse.json({ error: 'Coder template options are unavailable. Please retry.' }, { status: 503 });
      }
      if (body.templateId && body.templateId !== config.templateId && body.templateId !== config.templateName) {
        return NextResponse.json({ error: 'Choose a supported Coder IDE template.' }, { status: 400 });
      }
      if (!config.cpu.some((option) => option.value === String(cpu)) ||
          !config.memory.some((option) => option.value === String(memory))) {
        return NextResponse.json({ error: 'These resources are not available in the selected Coder template.' }, { status: 400 });
      }
      templateId = config.templateId;
      // Accept only a profile published on the template AND in our server-side
      // allowlist. The browser cannot request an arbitrary Docker image/URL.
      if (config.images.length) {
        const imageProfile = body.ideImage === undefined ? config.images[0].value : body.ideImage;
        if (typeof imageProfile !== 'string' ||
            !config.images.some((option) => option.value === imageProfile)) {
          return NextResponse.json({ error: 'Choose an approved IDE environment.' }, { status: 400 });
        }
        richParameterValues.push({ name: 'ide_image', value: imageProfile });
      } else if (body.ideImage !== undefined) {
        return NextResponse.json({ error: 'This Coder template does not support IDE environment selection.' }, { status: 400 });
      }
      if (config.diskSupported) richParameterValues.push({ name: 'home_disk_size', value: String(CODER_DISK_GIB) });
      const region = typeof body.region === 'string' ? body.region : '';
      if (region && !config.regions.some((option) => option.value === region)) {
        return NextResponse.json({ error: 'This region is not supported by the Coder template.' }, { status: 400 });
      }
      if (region) richParameterValues.push({ name: 'region', value: region });
      const requestedRepo = typeof body.repository === 'string' ? body.repository.trim() : '';
      if (requestedRepo) {
        if (!config.repositorySupported) {
          return NextResponse.json({ error: 'Coder must publish the repository parameters before repository launch is available.' }, { status: 409 });
        }
        const normalized = normalizePublicGithubRepo(requestedRepo);
        if (!normalized) return NextResponse.json({ error: 'Enter a valid public GitHub repository.' }, { status: 400 });
        let publicRepo;
        try { publicRepo = await getPublicGithubRepository(normalized); } catch {
          return NextResponse.json({ error: 'Public GitHub repository or branch is unavailable. Private repositories are not supported yet.' }, { status: 422 });
        }
        const branch = typeof body.branch === 'string' && body.branch ? body.branch : publicRepo.defaultBranch;
        if (!isSafeGithubBranch(branch) || !publicRepo.branches.includes(branch)) {
          return NextResponse.json({ error: 'Select a branch that exists in the public repository.' }, { status: 400 });
        }
        richParameterValues.push({ name: 'repo_url', value: `https://github.com/${publicRepo.fullName}.git` });
        richParameterValues.push({ name: 'repo_branch', value: branch });
      } else if (body.branch) {
        return NextResponse.json({ error: 'Select a repository before choosing a branch.' }, { status: 400 });
      }
      if (config.sshSupported) {
        const sshKey = await getUserSSHKey(user.id, user.email || user.id);
        richParameterValues.push({ name: 'ssh_public_key', value: sshKey.publicKey });
      }
    } else {
      if (body.repository || body.branch || body.region || body.ideImage !== undefined ||
          (body.templateId && body.templateId !== 'playcanvas-3d')) {
        return NextResponse.json({ error: 'Unsupported PlayCanvas launch option.' }, { status: 400 });
      }
      templateId = await getCoderTemplateId('playcanvas-3d');
      richParameterValues.push({ name: 'home_disk_size', value: String(CODER_DISK_GIB) });
    }

    // Counts ALLOCATED workspaces, not monthly starts. A stopped pod still has a
    // paid persistent disk. Concurrent requests acquire at most the plan's slots.
    const slotId = await reserveCoderSlot(user.id, podName);
    // If Coder times out AFTER creating a pod, keep the slot reserved. Never
    // automatically release it without verifying the remote workspace is gone.
    const workspace = await coder.createWorkspace(user.id, {
      name: podName, template_id: templateId, rich_parameter_values: richParameterValues,
      ttl_ms: CODER_TTL_MS,
    });
    await attachCoderWorkspace(user.id, slotId, workspace.id);
    if (podType === 'ide' && workspace.status === 'running') {
      await trackFunnelEvent('Workspace Launched', user.id, workspace.id, {
        workspace_type: 'ide', template_id: templateId,
      });
    }
    const workspaceUrl = workspace.url.replace(/\/$/, '');
    const ideUrl = `${workspaceUrl}/apps/${APP_SLUG_MAP[podType]}/`;
    return NextResponse.json({
      workspace: { id: workspace.id, name: workspace.name, status: workspace.status },
      ideUrl, podUrl: ideUrl, sshCommand: `coder ssh ${workspace.name}`, podType,
    });
  } catch (error) {
    if (error instanceof CostGateError) return costGateResponse(error);
    logger.error('WonderSpace Coder provisioning failed:', error instanceof Error ? error.name : 'Unknown error');
    return NextResponse.json({ error: 'Could not launch workspace. If creation timed out, its slot stays reserved until Coder confirms cleanup. Check workspace status before retrying.' }, { status: 502 });
  }
}
