import { createProjectRuntime, deleteProjectRuntime, getRuntimeStatus, getProjectSSHKey, createProjectPVC, saveProjectFiles, loadProjectFiles } from './provisioner';

export { createProjectRuntime, deleteProjectRuntime, getRuntimeStatus, getProjectSSHKey, createProjectPVC, saveProjectFiles, loadProjectFiles };

export type WorkspaceConfig = {
  workspaceId: string;
  userId: string;
  projectId?: string;
  name: string;
  type: string;
  resources?: { cpu: number; memoryGB: number; storageGB: number };
};

export type WorkspaceInfo = {
  id: string;
  name: string;
  type: string;
  status: string;
  url: string;
  createdAt: string;
};

export type WorkspaceType = 'ide' | 'playcanvas' | 'full';

export async function provisionWorkspace(config: WorkspaceConfig): Promise<WorkspaceInfo> {
  const { workspaceId, name, type } = config;
  const result = await createProjectRuntime(workspaceId, { storageSize: '1Gi' });
  return {
    id: workspaceId,
    name,
    type,
    status: result.success ? 'running' : 'error',
    url: result.url || '',
    createdAt: new Date().toISOString()
  };
}

export async function terminateWorkspace(workspaceId: string) {
  const result = await deleteProjectRuntime(workspaceId);
  return result.success;
}

export async function getWorkspaceStatus(workspaceId: string) {
  const status = await getRuntimeStatus(workspaceId);
  return {
    id: workspaceId,
    name: workspaceId,
    type: 'full',
    status: status.running ? 'running' : 'stopped',
    url: status.url || '',
    createdAt: new Date().toISOString(),
    resources: { cpu: 2, memoryGB: 4, storageGB: 5 }
  };
}

export async function listUserWorkspaces(userId: string) {
  return [];
}

export function getWorkspaceUrls(workspaceId: string) {
  const domain = process.env.RUNTIME_DOMAIN || 'wonder.dev';
  return {
    ide: `https://${workspaceId}.${domain}`,
    playcanvas: `https://pc-${workspaceId}.${domain}`,
    webglStudio: `https://ws-${workspaceId}.${domain}`
  };
}