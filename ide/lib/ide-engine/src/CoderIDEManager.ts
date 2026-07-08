import { EventEmitter } from 'events';

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface CoderWorkspace {
  id: string;
  name: string;
  url: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  template: string;
}

export interface CoderTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
}

export class CoderIDEManager extends EventEmitter {
  private workspace: CoderWorkspace | null = null;
  private isReadyFlag = false;
  private coderApiUrl: string;

  constructor(apiUrl: string = process.env.CODER_API_URL || 'https://coder.example.com') {
    super();
    this.coderApiUrl = apiUrl;
  }

  async boot(): Promise<CoderIDEManager> {
    // Check if we already have a workspace
    const existingWorkspace = await this.getUserWorkspace();
    if (existingWorkspace) {
      this.workspace = existingWorkspace;
      this.isReadyFlag = true;
      this.emit('ready', this.workspace);
      return this;
    }

    // Create a new workspace with default template
    const template = await this.getDefaultTemplate();
    this.workspace = await this.createWorkspace(template.id, 'my-workspace');
    
    // Wait for workspace to be ready
    await this.waitForWorkspaceReady();
    
    this.isReadyFlag = true;
    this.emit('ready', this.workspace);
    return this;
  }

  isReady(): boolean {
    return this.isReadyFlag && this.workspace?.status === 'running';
  }

  getInstance(): CoderWorkspace | null {
    return this.workspace;
  }

  async getFileTree(): Promise<FileNode[]> {
    if (!this.isReady()) throw new Error('Coder IDE not ready');
    
    // Fetch file tree from Coder workspace
    const response = await fetch(`${this.coderApiUrl}/api/v2/workspaces/${this.workspace!.id}/files`);
    if (!response.ok) {
      throw new Error('Failed to fetch file tree');
    }
    
    return await response.json();
  }

  async readFile(filePath: string): Promise<string> {
    if (!this.isReady()) throw new Error('Coder IDE not ready');
    
    const response = await fetch(`${this.coderApiUrl}/api/v2/workspaces/${this.workspace!.id}/files/${encodeURIComponent(filePath)}`);
    if (!response.ok) {
      throw new Error(`Failed to read file: ${filePath}`);
    }
    
    return await response.text();
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    if (!this.isReady()) throw new Error('Coder IDE not ready');
    
    const response = await fetch(`${this.coderApiUrl}/api/v2/workspaces/${this.workspace!.id}/files/${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: content,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to write file: ${filePath}`);
    }
  }

  async spawn(command: string, args: string[] = []): Promise<{ exit: Promise<number> }> {
    if (!this.isReady()) throw new Error('Coder IDE not ready');
    
    const response = await fetch(`${this.coderApiUrl}/api/v2/workspaces/${this.workspace!.id}/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, args }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to execute command: ${command}`);
    }
    
    const data = await response.json();
    return {
      exit: Promise.resolve(data.exitCode || 0)
    };
  }

  async mountProject(fileTree?: FileNode[]): Promise<void> {
    if (!this.isReady()) throw new Error('Coder IDE not ready');
    
    if (fileTree) {
      // Upload project files to workspace
      for (const node of fileTree) {
        if (node.type === 'file') {
          await this.writeFile(node.name, ''); // Empty file for now
        }
      }
    }
    
    this.emit('serverReady', 3000, `${this.workspace!.url}`);
  }

  onServerReady(callback: (port: number, url: string) => void): void {
    this.on('serverReady', callback);
  }

  // Coder-specific methods
  async getTemplates(): Promise<CoderTemplate[]> {
    const response = await fetch(`${this.coderApiUrl}/api/v2/templates`);
    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }
    
    const data = await response.json();
    return data.templates || [];
  }

  async createWorkspace(templateId: string, name: string): Promise<CoderWorkspace> {
    const response = await fetch(`${this.coderApiUrl}/api/v2/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        name,
        rich_parameter_values: []
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create workspace');
    }
    
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      url: data.access_url,
      status: 'creating',
      template: templateId
    };
  }

  async getUserWorkspace(): Promise<CoderWorkspace | null> {
    const response = await fetch(`${this.coderApiUrl}/api/v2/workspaces?owner=me`);
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
        template: ws.template_id
      };
    }
    
    return null;
  }

  async waitForWorkspaceReady(): Promise<void> {
    if (!this.workspace) return;
    
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (attempts < maxAttempts) {
      const workspace = await this.getUserWorkspace();
      if (workspace && workspace.status === 'running') {
        this.workspace = workspace;
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Workspace failed to start');
  }

  private async getDefaultTemplate(): Promise<CoderTemplate> {
    const templates = await this.getTemplates();
    
    // Prefer web development templates
    const webTemplate = templates.find(t => 
      t.tags.includes('web') || t.tags.includes('javascript') || t.tags.includes('node')
    );
    
    if (webTemplate) return webTemplate;
    
    // Fallback to first available template
    if (templates.length > 0) return templates[0];
    
    throw new Error('No templates available');
  }
}