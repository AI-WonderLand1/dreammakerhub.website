import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { CoderAPIWrapper } from '@/lib/coder/api-wrapper';
import { getUserSSHKey } from '@/lib/coder/user-ssh-keys';
import { getCoderLaunchConfig, getPublicGithubRepository, isSafeGithubBranch, normalizePublicGithubRepo } from '@/lib/coder/launch-options';
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
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  if (!Number.isFinite(cpu) || !Number.isFinite(memory) || !Number.isInteger(cpu) || !Number.isInteger(memory)) {
    return NextResponse.json({ error: 'CPU and memory must be whole numbers.' }, { status: 400 });
  }
  if (podType === 'playcanvas' && (![1, 2, 3, 4].includes(cpu) || ![1, 2, 4, 8].includes(memory))) {
    return NextResponse.json({ error: 'Unsupported PlayCanvas CPU or memory value.' }, { status: 400 });
  }
  if (!process.env.CODER_API_URL || !process.env.CODER_API_TOKEN) {
    return NextResponse.json({ error: 'WonderSpace cloud IDE is not configured on the server.' }, { status: 503 });
  }
  const coder = new CoderAPIWrapper({
    apiUrl: process.env.CODER_API_URL,
    apiKey: process.env.CODER_API_TOKEN,
    userId: user.id,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  });
  try {
    if (!(await coder.healthCheck())) {
      return NextResponse.json({ error: 'WonderSpace cloud IDE is temporarily unavailable.' }, { status: 503 });
    }
    let templateId = TEMPLATE_MAP[podType];
    const richParameterValues = [
      { name: 'cpu', value: String(cpu) },
      { name: 'memory', value: String(memory) },
      { name: 'home_disk_size', value: '20' },
    ];
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
      const sshKey = await getUserSSHKey(user.id, user.email || user.id);
      richParameterValues.push({ name: 'ssh_public_key', value: sshKey.publicKey });
    } else {
      if (body.repository || body.branch || body.region ||
          (body.templateId && body.templateId !== TEMPLATE_MAP.playcanvas)) {
        return NextResponse.json({ error: 'Unsupported PlayCanvas launch option.' }, { status: 400 });
      }
    }
    const workspace = await coder.createWorkspace(user.id, {
      name: podName,
      template_id: templateId,
      rich_parameter_values: richParameterValues,
      ttl_ms: 4 * 60 * 60 * 1000,
    });
    const workspaceUrl = workspace.url.replace(/\/$/, '');
    const ideUrl = `${workspaceUrl}/apps/${APP_SLUG_MAP[podType]}/`;
    return NextResponse.json({
      workspace: { id: workspace.id, name: workspace.name, status: workspace.status },
      ideUrl,
      podUrl: ideUrl,
      sshCommand: `coder ssh ${workspace.name}`,
      podType,
    });
  } catch (error) {
    logger.error('WonderSpace Coder provisioning failed:', error instanceof Error ? error.name : 'Unknown error');
    return NextResponse.json({ error: 'Could not launch workspace. Check Coder workspace status and try again.' }, { status: 502 });
  }
}
