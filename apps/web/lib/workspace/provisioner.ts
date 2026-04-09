import Dockerode from 'dockerode';

export type WorkspaceType = 'ide' | 'playcanvas' | 'full';

export interface WorkspaceConfig {
  workspaceId: string;
  userId: string;
  projectId?: string;
  name: string;
  type: WorkspaceType;
  resources?: {
    cpu: number;
    memoryGB: number;
    storageGB: number;
  };
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  type: WorkspaceType;
  status: 'provisioning' | 'running' | 'stopped' | 'error' | 'deleted';
  url: string;
  playcanvasUrl: string;
  webglStudioUrl: string;
  containerId?: string;
  createdAt: string;
  resources: { cpu: number; memoryGB: number; storageGB: number };
}

const WORKSPACE_IMAGE = process.env.WORKSPACE_DOCKER_IMAGE || 'wonderspace/workspace:latest';
const WORKSPACE_NETWORK = process.env.WORKSPACE_DOCKER_NETWORK || 'wonderspace';
const WORKSPACE_DOMAIN = process.env.WORKSPACE_DOMAIN || 'localhost';

let dockerInstance: Dockerode | null = null;

function getDocker(): Dockerode {
  if (!dockerInstance) {
    dockerInstance = new Dockerode({
      socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
      host: process.env.DOCKER_HOST || undefined as any,
      port: process.env.DOCKER_PORT ? parseInt(process.env.DOCKER_PORT) : undefined as any,
    });
  }
  return dockerInstance;
}

function isDockerAvailable(): boolean {
  return !!(process.env.DOCKER_HOST || process.env.DOCKER_SOCKET);
}

export function getWorkspaceUrls(workspaceId: string): { ide: string; playcanvas: string; webglStudio: string } {
  const domain = WORKSPACE_DOMAIN;
  if (domain === 'localhost') {
    const basePort = 10000 + hashCode(workspaceId) % 5000;
    return {
      ide: `http://localhost:${basePort}`,
      playcanvas: `http://localhost:${basePort + 1}`,
      webglStudio: `http://localhost:${basePort + 2}`,
    };
  }
  return {
    ide: `https://${workspaceId}.${domain}`,
    playcanvas: `https://pc-${workspaceId}.${domain}`,
    webglStudio: `https://ws-${workspaceId}.${domain}`,
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export async function provisionWorkspace(config: WorkspaceConfig): Promise<WorkspaceInfo> {
  const urls = getWorkspaceUrls(config.workspaceId);
  const resources = config.resources || { cpu: 2, memoryGB: 4, storageGB: 5 };

  if (!isDockerAvailable()) {
    return {
      id: config.workspaceId,
      name: config.name,
      type: config.type,
      status: 'running',
      url: urls.ide,
      playcanvasUrl: urls.playcanvas,
      webglStudioUrl: urls.webglStudio,
      createdAt: new Date().toISOString(),
      resources,
    };
  }

  const docker = getDocker();
  const idePort = 10000 + hashCode(config.workspaceId) % 5000;

  try {
    await ensureNetwork(docker);

    const container = await docker.createContainer({
      name: `ws-${config.workspaceId}`,
      Image: WORKSPACE_IMAGE,
      Env: [
        `WORKSPACE_NAME=${config.name}`,
        `WORKSPACE_ID=${config.workspaceId}`,
        `USER_ID=${config.userId}`,
        `PROJECT_ID=${config.projectId || ''}`,
        `WS_DIR=/home/coder/project`,
      ],
      ExposedPorts: {
        '8080/tcp': {},
        '3001/tcp': {},
        '3002/tcp': {},
      },
      HostConfig: {
        PortBindings: {
          '8080/tcp': [{ HostPort: String(idePort) }],
          '3001/tcp': [{ HostPort: String(idePort + 1) }],
          '3002/tcp': [{ HostPort: String(idePort + 2) }],
        },
        Memory: resources.memoryGB * 1024 * 1024 * 1024,
        NanoCpus: resources.cpu * 1e9,
        RestartPolicy: { Name: 'unless-stopped' },
      },
      Labels: {
        'wonderspace.workspace.id': config.workspaceId,
        'wonderspace.user.id': config.userId,
        'wonderspace.project.id': config.projectId || '',
        'wonderspace.type': config.type,
      },
    });

    await container.start();

    return {
      id: config.workspaceId,
      name: config.name,
      type: config.type,
      status: 'provisioning',
      url: urls.ide,
      playcanvasUrl: urls.playcanvas,
      webglStudioUrl: urls.webglStudio,
      containerId: container.id,
      createdAt: new Date().toISOString(),
      resources,
    };
  } catch (error) {
    console.error('Workspace provision error:', error);
    return {
      id: config.workspaceId,
      name: config.name,
      type: config.type,
      status: 'error',
      url: urls.ide,
      playcanvasUrl: urls.playcanvas,
      webglStudioUrl: urls.webglStudio,
      createdAt: new Date().toISOString(),
      resources,
    };
  }
}

async function ensureNetwork(docker: Dockerode): Promise<void> {
  try {
    await docker.getNetwork(WORKSPACE_NETWORK).inspect();
  } catch {
    await docker.createNetwork({
      Name: WORKSPACE_NETWORK,
      Driver: 'bridge',
      Labels: { 'wonderspace.managed': 'true' },
    });
  }
}

export async function terminateWorkspace(workspaceId: string): Promise<boolean> {
  if (!isDockerAvailable()) return true;

  const docker = getDocker();

  try {
    const container = docker.getContainer(`ws-${workspaceId}`);
    await container.stop();
    await container.remove();
    return true;
  } catch (error) {
    console.error('Workspace terminate error:', error);
    return false;
  }
}

export async function getWorkspaceStatus(workspaceId: string): Promise<WorkspaceInfo | null> {
  if (!isDockerAvailable()) {
    const urls = getWorkspaceUrls(workspaceId);
    return {
      id: workspaceId,
      name: workspaceId,
      type: 'full',
      status: 'running',
      url: urls.ide,
      playcanvasUrl: urls.playcanvas,
      webglStudioUrl: urls.webglStudio,
      createdAt: new Date().toISOString(),
      resources: { cpu: 2, memoryGB: 4, storageGB: 5 },
    };
  }

  const docker = getDocker();
  const urls = getWorkspaceUrls(workspaceId);

  try {
    const container = docker.getContainer(`ws-${workspaceId}`);
    const info = await container.inspect();
    const status = info.State.Running ? 'running' : 'stopped';

    return {
      id: workspaceId,
      name: info.Config.Labels?.['wonderspace.workspace.id'] || workspaceId,
      type: (info.Config.Labels?.['wonderspace.type'] as WorkspaceType) || 'full',
      status,
      url: urls.ide,
      playcanvasUrl: urls.playcanvas,
      webglStudioUrl: urls.webglStudio,
      containerId: container.id,
      createdAt: info.Created,
      resources: { cpu: 2, memoryGB: 4, storageGB: 5 },
    };
  } catch {
    return null;
  }
}

export async function listUserWorkspaces(userId: string): Promise<WorkspaceInfo[]> {
  if (!isDockerAvailable()) return [];

  const docker = getDocker();

  try {
    const containers = await docker.listContainers({
      all: true,
      filters: {
        label: [`wonderspace.user.id=${userId}`],
      },
    });

    return containers.map((c) => {
      const workspaceId = c.Labels?.['wonderspace.workspace.id'] || '';
      const urls = getWorkspaceUrls(workspaceId);
      return {
        id: workspaceId,
        name: c.Labels?.['wonderspace.workspace.id'] || c.Names[0]?.replace('/ws-', '') || '',
        type: (c.Labels?.['wonderspace.type'] as WorkspaceType) || 'full',
        status: c.State === 'running' ? 'running' : 'stopped',
        url: urls.ide,
        playcanvasUrl: urls.playcanvas,
        webglStudioUrl: urls.webglStudio,
        containerId: c.Id,
        createdAt: c.Created || new Date().toISOString(),
        resources: { cpu: 2, memoryGB: 4, storageGB: 5 },
      };
    });
  } catch {
    return [];
  }
}