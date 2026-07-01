export interface CoderWorkspace {
  id: string;
  name: string;
  url: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  templateId: string;
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
    options?: { customName?: string; sshPublicKey?: string }
  ): Promise<CoderWorkspace> {
    // Use custom name if provided, otherwise generate one
    const workspaceName = options?.customName
      ? options.customName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 62)
      : `${userId}-${projectName}-${Date.now()}`;
    
    const richParameterValues: Array<{ name: string; value: string }> = [
      { name: 'cpu', value: '2' },
      { name: 'memory', value: '4' },
      { name: 'home_disk_size', value: '20' },
    ];

    // Inject SSH public key if provided
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
        template_id: templateId,
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
    // Redirect to Coder.com workspace
    return `${workspace.url}/code-server`;
  }

  /**
   * Create or get workspace for AI-built project
   */
  async provisionIDEForProject(
    userId: string,
    projectName: string,
    projectCode?: string,
    options?: { customName?: string; sshPublicKey?: string }
  ): Promise<{ workspace: CoderWorkspace; ideUrl: string }> {
    // Check for existing workspace
    let workspace = await this.getUserWorkspace(userId);

    if (!workspace) {
      // Create new workspace with custom name and SSH key
      workspace = await this.createWorkspace(userId, projectName, 'wonderspace-ide', options);
    }

    // Wait for workspace to be ready
    if (workspace.status !== 'running') {
      await this.waitForWorkspaceReady(workspace.id);
      workspace.status = 'running';
    }

    // If project code provided, upload it to the workspace
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
    // Create project structure
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

    // Upload each file
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