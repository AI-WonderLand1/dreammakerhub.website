export interface CoderWorkspace {
  id: string;
  name: string;
  url: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  templateId: string;
}

interface ProvisionOptions {
  customName?: string;
  sshPublicKey?: string;
  templateId?: string;
  cpu?: number;
  memory?: number;
}

export class CoderIntegration {
  private coderApiUrl: string;

  constructor(apiUrl: string = process.env.CODER_API_URL || process.env.NEXT_PUBLIC_CODER_API_URL || 'https://coder-production-cde8.up.railway.app') {
    this.coderApiUrl = apiUrl.replace(/\/$/, '');
  }

  /**
   * Create a new Coder workspace for a user
   * Each user gets their OWN isolated workspace - not shared with anyone
   */
  async createWorkspace(
    userId: string,
    projectName: string,
    templateId: string = 'wonderspace-ide',
    options?: ProvisionOptions
  ): Promise<CoderWorkspace> {
    const workspaceName = options?.customName
      ? options.customName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 62)
      : `${userId}-${projectName}-${Date.now()}`;

    const effectiveTemplateId = options?.templateId || templateId;

    const richParameterValues: Array<{ name: string; value: string }> = [
      { name: 'cpu', value: String(options?.cpu || 2) },
      { name: 'memory', value: String(options?.memory || 4) },
      { name: 'home_disk_size', value: '20' },
    ];

    if (options?.sshPublicKey) {
      richParameterValues.push({
        name: 'ssh_public_key',
        value: options.sshPublicKey,
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${this.coderApiUrl}/api/v2/workspaces`, {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Coder-User-ID': userId,
      },
      body: JSON.stringify({
        template_id: effectiveTemplateId,
        name: workspaceName,
        rich_parameter_values: richParameterValues,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create workspace: ${response.statusText}`);
    }

    clearTimeout(timeoutId);
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      url: data.access_url,
      status: 'creating',
      templateId: data.template_id,
    };
  }

  /**
   * Get user's existing workspace
   */
  async getUserWorkspace(userId: string): Promise<CoderWorkspace | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${this.coderApiUrl}/api/v2/workspaces?owner=${userId}`, {
      signal: controller.signal,
      headers: {
        'Coder-User-ID': userId,
      },
    });

    clearTimeout(timeoutId);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const workspaces = data.workspaces || [];

    if (workspaces.length > 0) {
      const ws = workspaces[0];
      return {
        id: ws.id,
        name: ws.name,
        url: ws.access_url,
        status: ws.status,
        templateId: ws.template_id,
      };
    }

    return null;
  }

  /**
   * Wait for workspace to be ready
   */
  async waitForWorkspaceReady(workspaceId: string, timeoutMs: number = 30000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.coderApiUrl}/api/v2/workspaces/${workspaceId}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'running') {
          return;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Workspace failed to start within timeout');
  }

  /**
   * Build IDE URL that redirects to Coder workspace
   */
  buildIDEUrl(workspace: CoderWorkspace): string {
    return `${workspace.url}/code-server`;
  }

  /**
   * Create or get workspace for AI-built project
   */
  async provisionIDEForProject(
    userId: string,
    projectName: string,
    projectCode?: string,
    options?: ProvisionOptions
  ): Promise<{ workspace: CoderWorkspace; ideUrl: string }> {
    let workspace = await this.getUserWorkspace(userId);

    if (!workspace) {
      workspace = await this.createWorkspace(userId, projectName, 'wonderspace-ide', options);
    }

    if (workspace.status !== 'running') {
      await this.waitForWorkspaceReady(workspace.id);
      workspace.status = 'running';
    }

    if (projectCode) {
      await this.uploadProjectToWorkspace(workspace.id, projectCode, projectName);
    }

    const ideUrl = this.buildIDEUrl(workspace);
    return { workspace, ideUrl };
  }

  /**
   * Upload project code to workspace
   */
  private async uploadProjectToWorkspace(
    workspaceId: string,
    code: string,
    projectName: string
  ): Promise<void> {
    const files = {
      'index.html': code,
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        scripts: {
          dev: 'npx serve .',
          start: 'npx serve .',
        },
        dependencies: {
          serve: '^14.0.0',
        },
      }, null, 2),
    };

    for (const [filename, content] of Object.entries(files)) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `${this.coderApiUrl}/api/v2/workspaces/${workspaceId}/files/${encodeURIComponent(filename)}`,
        {
          signal: controller.signal,
          method: 'PUT',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: content,
        }
      );

      clearTimeout(timeoutId);
      if (!response.ok) {
        console.warn(`Failed to upload ${filename} to workspace`);
      }
    }
  }
}
