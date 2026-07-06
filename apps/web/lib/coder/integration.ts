const WORKSPACE_SERVICE_URL = process.env.CODER_WORKSPACE_URL || 'http://localhost:3091';

export interface CoderWorkspace {
  id: string;
  name: string;
  url: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  templateId: string;
}

export class CoderIntegration {
  private serviceUrl: string;

  constructor(serviceUrl: string = WORKSPACE_SERVICE_URL) {
    this.serviceUrl = serviceUrl;
  }

  private async request(method: string, path: string, body?: unknown, token?: string) {
    const url = `${this.serviceUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Workspace service returned ${res.status}`);
    }

    return data;
  }

  async createWorkspace(
    userId: string,
    projectName: string,
    templateId: string = 'wonderspace-ide',
    token?: string
  ): Promise<CoderWorkspace> {
    const workspace = await this.request('POST', '/api/workspaces', {
      templateId,
      name: `${projectName}-${Date.now().toString(36)}`,
      cpu: '2',
      memory: '4',
      disk: '20',
    }, token);

    return {
      id: workspace.id,
      name: workspace.name,
      url: workspace.accessUrl || '',
      status: 'creating',
      templateId: workspace.templateId,
    };
  }

  async getUserWorkspace(userId: string, token?: string): Promise<CoderWorkspace | null> {
    try {
      const data = await this.request('GET', '/api/workspaces', undefined, token);
      const workspaces = data.workspaces || [];
      if (workspaces.length === 0) return null;

      const ws = workspaces[0];
      return {
        id: ws.id,
        name: ws.name,
        url: ws.accessUrl || '',
        status: ws.latestBuild?.status === 'running' ? 'running' : 'stopped',
        templateId: ws.templateId,
      };
    } catch {
      return null;
    }
  }

  async waitForWorkspaceReady(workspaceId: string, token?: string, timeoutMs: number = 60000): Promise<void> {
    await this.request('POST', `/api/workspaces/${workspaceId}/wait`, {
      timeoutMs,
      intervalMs: 2000,
    }, token);
  }

  buildIDEUrl(workspace: CoderWorkspace): string {
    return `${workspace.url}/code-server`;
  }

  async provisionIDEForProject(
    userId: string,
    projectName: string,
    projectCode?: string,
    token?: string
  ): Promise<{ workspace: CoderWorkspace; ideUrl: string }> {
    let workspace = await this.getUserWorkspace(userId, token);

    if (!workspace) {
      workspace = await this.createWorkspace(userId, projectName, 'wonderspace-ide', token);
    }

    if (workspace.status !== 'running') {
      await this.waitForWorkspaceReady(workspace.id, token);
      workspace.status = 'running';
    }

    if (projectCode) {
      await this.uploadProjectToWorkspace(workspace.id, projectCode, projectName, token);
    }

    const ideUrl = this.buildIDEUrl(workspace);
    return { workspace, ideUrl };
  }

  private async uploadProjectToWorkspace(
    workspaceId: string,
    code: string,
    projectName: string,
    token?: string
  ): Promise<void> {
    const files: Record<string, string> = {
      'index.html': code,
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        scripts: { dev: 'npx serve .', start: 'npx serve .' },
        dependencies: { serve: '^14.0.0' },
      }, null, 2),
    };

    for (const [filename, content] of Object.entries(files)) {
      try {
        await this.request('PUT', `/api/workspaces/${workspaceId}/files/${encodeURIComponent(filename)}`, content, token);
      } catch (err) {
        console.warn(`Failed to upload ${filename}:`, err);
      }
    }
  }
}
