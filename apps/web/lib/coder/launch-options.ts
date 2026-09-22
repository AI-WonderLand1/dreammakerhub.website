// Coder launch capability discovery. Never return credentials to the browser.
import { secureCoderApiOrigin } from './secure-origin';

export type CoderLaunchOption = { label: string; value: string };
export type CoderLaunchConfig = {
  templateId: string;
  templateName: string;
  cpu: CoderLaunchOption[];
  memory: CoderLaunchOption[];
  regions: CoderLaunchOption[];
  repositorySupported: boolean;
  sshSupported: boolean;
  diskSupported: boolean;
};
type CoderTemplate = { id: string; name: string; active_version_id?: string };
type CoderParameter = { name: string; options?: { name?: string; value: string }[] };
const REPO_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9._-]{1,100}$/;
const BRANCH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,119}$/;

export function normalizePublicGithubRepo(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  let path = trimmed;
  if (trimmed.startsWith('https://')) {
    let url: URL;
    try { url = new URL(trimmed); } catch { return null; }
    if (url.hostname !== 'github.com' || url.username || url.password || url.port || url.search || url.hash) return null;
    path = url.pathname.replace(/^\//, '').replace(/\/$/, '');
  }
  path = path.replace(/\.git$/, '');
  if (!REPO_PATTERN.test(path) || path.split('/').some((part) => part === '.' || part === '..')) return null;
  return path;
}

export function isSafeGithubBranch(branch: unknown): branch is string {
  return typeof branch === 'string' && BRANCH_PATTERN.test(branch) &&
    !branch.includes('..') && !branch.includes('//') && !branch.endsWith('.') &&
    !branch.endsWith('/') && !branch.includes('@{') && !branch.endsWith('.lock');
}

export async function getPublicGithubRepository(fullName: string): Promise<{
  fullName: string; defaultBranch: string; branches: string[];
}> {
  const repo = normalizePublicGithubRepo(fullName);
  if (!repo) throw new Error('Enter a valid public GitHub owner/repository.');
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'DreamMakerHub-WonderSpace' };
  const info = await fetch(`https://api.github.com/repos/${repo}`, { headers, cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!info.ok) throw new Error('Public GitHub repository unavailable. Private repositories require a user-authorized GitHub connection.');
  const metadata: { private?: boolean; full_name?: string; default_branch?: string } = await info.json();
  if (metadata.private || !metadata.full_name || !metadata.default_branch) throw new Error('This repository cannot be cloned anonymously.');
  const branchesResponse = await fetch(`https://api.github.com/repos/${repo}/branches?per_page=100`, { headers, cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!branchesResponse.ok) throw new Error('Could not load GitHub branches; please retry.');
  const branchesData: { name?: string }[] = await branchesResponse.json();
  const branches = branchesData.map(({ name }) => name).filter(isSafeGithubBranch);
  if (isSafeGithubBranch(metadata.default_branch) && !branches.includes(metadata.default_branch)) branches.unshift(metadata.default_branch);
  return { fullName: metadata.full_name, defaultBranch: metadata.default_branch, branches };
}

async function coderGet<T>(path: string): Promise<T> {
  const configured = process.env.CODER_API_URL;
  const token = process.env.CODER_API_TOKEN;
  if (!configured || !token) throw new Error('Coder is not configured.');
  const origin = secureCoderApiOrigin(configured);
  const response = await fetch(`${origin}${path}`, {
    headers: { 'Coder-Session-Token': token, Accept: 'application/json' },
    cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Could not read Coder template capabilities.');
  return response.json() as Promise<T>;
}

async function getPublishedCoderTemplate(names: string[]): Promise<CoderTemplate> {
  const templates = await coderGet<CoderTemplate[]>('/api/v2/templates');
  if (!Array.isArray(templates)) throw new Error('Coder returned an invalid template list.');
  const template = names.map((name) => templates.find((item) => item.name === name))
    .find((item) => item?.id && item.active_version_id);
  if (!template) throw new Error('The requested template is not published in Coder.');
  return template;
}

export async function getCoderTemplateId(name: string): Promise<string> {
  return (await getPublishedCoderTemplate([name])).id;
}

export async function getCoderLaunchConfig(): Promise<CoderLaunchConfig> {
  const configured = process.env.CODER_IDE_TEMPLATE_NAME;
  // Prefer an explicitly configured template. The existing live Coder deployment
  // publishes its IDE as "kubernetes"; do not require operators to rename it.
  const names = configured ? [configured] : ['wonderspace-ide', 'kubernetes-mvp', 'kubernetes'];
  const template = await getPublishedCoderTemplate(names);
  const parameters = await coderGet<CoderParameter[]>(`/api/v2/templateversions/${encodeURIComponent(template.active_version_id!)}/rich-parameters`);
  if (!Array.isArray(parameters)) throw new Error('Coder returned an invalid parameter list.');
  const byName = (name: string) => parameters.find((parameter) => parameter.name === name);
  const choices = (name: string): CoderLaunchOption[] => (byName(name)?.options || [])
    .map((option) => ({ label: option.name || option.value, value: option.value }));
  const cpu = choices('cpu');
  const memory = choices('memory');
  if (!cpu.length || !memory.length) throw new Error('The published Coder template has no selectable CPU and memory options.');
  return {
    templateId: template.id, templateName: template.name, cpu, memory,
    regions: choices('region'),
    repositorySupported: Boolean(byName('repo_url') && byName('repo_branch')),
    sshSupported: Boolean(byName('ssh_public_key')),
    diskSupported: Boolean(byName('home_disk_size')),
  };
}
