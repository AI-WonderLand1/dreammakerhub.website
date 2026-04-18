export type WorkspaceType = 'ide' | 'playcanvas' | 'full';

export interface WorkspaceConfig {
  workspaceId: string;
  userId: string;
  projectId?: string;
  name: string;
  type: WorkspaceType;
  resources?: { cpu: number; memoryGB: number; storageGB: number };
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  type: WorkspaceType;
  status: 'provisioning' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error' | 'deleted';
  url: string;
  playcanvasUrl: string;
  webglStudioUrl: string;
  containerId?: string;
  createdAt: string;
  resources: { cpu: number; memoryGB: number; storageGB: number };
}

const WORKSPACE_DOMAIN = process.env.WORKSPACE_DOMAIN || 'localhost';

export function getWorkspaceUrls(workspaceId: string): { ide: string; playcanvas: string; webglStudio: string } {
  const domain = WORKSPACE_DOMAIN;
  if (domain === 'localhost') {
    const basePort = 10000 + hashCode(workspaceId) % 5000;
    return { ide: `http://localhost:${basePort}`, playcanvas: `http://localhost:${basePort + 1}`, webglStudio: `http://localhost:${basePort + 2}` };
  }
  return { ide: `https://${workspaceId}.${domain}`, playcanvas: `https://pc-${workspaceId}.${domain}`, webglStudio: `https://ws-${workspaceId}.${domain}` };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); }
  return Math.abs(hash);
}

function mockWorkspace(config: WorkspaceConfig): WorkspaceInfo {
  const urls = getWorkspaceUrls(config.workspaceId);
  return { id: config.workspaceId, name: config.name, type: config.type, status: 'running', url: urls.ide, playcanvasUrl: urls.playcanvas, webglStudioUrl: urls.webglStudio, createdAt: new Date().toISOString(), resources: config.resources || { cpu: 2, memoryGB: 4, storageGB: 5 } };
}

// Workspaces run in the browser via WebContainer — no Docker needed.
// Each user gets an isolated browser-based workspace.
// VPS is used as a build server for heavy ops (npm install, asset generation).
export async function provisionWorkspace(config: WorkspaceConfig): Promise<WorkspaceInfo> {
  return mockWorkspace(config);
}

export async function stopWorkspace(workspaceId: string): Promise<boolean> {
  return true;
}

export async function startWorkspace(workspaceId: string): Promise<boolean> {
  return true;
}

export async function terminateWorkspace(workspaceId: string): Promise<boolean> {
  return true;
}

export async function getWorkspaceStatus(workspaceId: string): Promise<WorkspaceInfo | null> {
  const urls = getWorkspaceUrls(workspaceId);
  return { id: workspaceId, name: workspaceId, type: 'full', status: 'running', url: urls.ide, playcanvasUrl: urls.playcanvas, webglStudioUrl: urls.webglStudio, createdAt: new Date().toISOString(), resources: { cpu: 2, memoryGB: 4, storageGB: 5 } };
}

export async function listUserWorkspaces(userId: string): Promise<WorkspaceInfo[]> {
  return [];
}