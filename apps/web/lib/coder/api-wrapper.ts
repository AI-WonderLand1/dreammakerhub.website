// Coder API Wrapper for AI Wonderland
// Provides unified API wrapper for Coder IDE integration
// Supports both Coder IDE and WonderSpace IDE environments

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface CoderAPIConfig {
  apiUrl: string;
  apiKey?: string;
  userId?: string;
  environment?: 'production' | 'development' | 'staging';
}

export interface CoderWorkspace {
  id: string;
  name: string;
  url: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  templateId: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface CreateWorkspaceOptions {
  templateId?: string;
  name?: string;
  cpu?: number;
  memory?: number;
  sshPublicKey?: string;
  customName?: string;
  image?: string;
  environmentVariables?: Record<string, string>;
  gitProvider?: 'github' | 'gitlab' | 'bitbucket' | 'git';
  gitRepo?: string;
  bindPort?: number;
  autoStart?: boolean;
}

export interface ProvisionResult {
  workspace: CoderWorkspace;
  ideUrl: string;
  sshCommand?: string;
  status: 'success' | 'error';
  error?: string;
}

export class CoderAPIWrapper {
  private config: CoderAPIConfig;
  private supabase: ReturnType<typeof createClient>;
  private baseApiUrl: string;
  
  constructor(config: CoderAPIConfig) {
    this.config = config;
    this.baseApiUrl = config.apiUrl.replace(/\/$/, '');
    
    // Initialize Supabase for workspace persistence
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );
    
    console.log(`[CoderAPIWrapper] Initialized with baseUrl: ${this.baseApiUrl}`);
  }

  /**
   * Create a new Coder workspace for a user
   * Supports Coder IDE and WonderSpace IDE templates
   */
  async createWorkspace(userId: string, options: CreateWorkspaceOptions): Promise<CoderWorkspace> {
    // Generate workspace ID
    const workspaceId = crypto.randomUUID();
    const timestamp = Date.now();
    
    // Determine template ID
    const templateId = options.templateId || 'wonderspace-ide';
    
    // Build workspace name
    let workspaceName = options.name || options.customName;
    if (!workspaceName) {
      const baseName = `ai-wonder-space-${userId}-${timestamp.toString().slice(-6)}`;
      workspaceName = baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }
    
    // Prepare Coder API request payload
    const coderPayload = {
      template_id: templateId,
      name: workspaceName,
      rich_parameter_values: this.buildRichParameterValues(userId, templateId, options),
      labels: {
        user_id: userId,
        created_by: 'ai-wonderland',
        environment: this.config.environment,
        timestamp: timestamp.toString(),
      },
    };
    
    if (options.image) {
      coderPayload.image = options.image;
    }
    
    try {
      // Make request to Coder API
      const response = await this.makeApiRequest('/api/v2/workspaces', 'POST', coderPayload, {
        'Coder-User-ID': userId,
        'Content-Type': 'application/json',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Coder API error: ${errorData.error || response.statusText}`);
      }
      
      const coderWorkspace = await response.json();
      
      // Store workspace metadata in Supabase for persistence
      const workspaceData: CoderWorkspace = {
        id: workspaceId,
        name: workspaceName,
        url: coderWorkspace.access_url || coderWorkspace.url,
        status: 'creating',
        templateId: coderWorkspace.template_id || templateId,
        createdAt: timestamp,
      };
      
      // Store in Supabase for real-time updates
      await this.storeWorkspace(userId, workspaceData);
      
      // Poll for workspace to be ready
      await this.waitForWorkspaceReady(workspaceId, userId, 60000);
      
      // Update status to running
      workspaceData.status = 'running';
      workspaceData.updatedAt = Date.now();
      await this.updateWorkspace(userId, workspaceData);
      
      console.log(`[CoderAPIWrapper] Workspace created successfully: ${workspaceName} (${workspaceId})`);
      return workspaceData;
      
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to create workspace:`, error);
      
      // Store error state
      await this.storeWorkspace(userId, {
        id: workspaceId,
        name: workspaceName,
        url: '',
        status: 'error',
        templateId: templateId,
        createdAt: timestamp,
      });
      
      throw error;
    }
  }

  /**
   * Wait for workspace to be ready
   * Polls Coder API until workspace status is 'running'
   */
  private async waitForWorkspaceReady(workspaceId: string, userId: string, timeoutMs: number = 60000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 2000; // Poll every 2 seconds
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const workspace = await this.getWorkspace(userId, workspaceId);
        
        if (workspace.status === 'running') {
          console.log(`[CoderAPIWrapper] Workspace ready: ${workspaceId}`);
          return;
        }
        
        if (workspace.status === 'error') {
          throw new Error(`Workspace failed: ${workspaceId}`);
        }
        
        // Still creating, wait and retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
      } catch (error) {
        // Continue polling unless it's an unrecoverable error
        console.warn(`[CoderAPIWrapper] Error checking workspace status:`, error);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    throw new Error(`Workspace creation timeout: ${workspaceId}`);
  }

  /**
   * Get user's existing workspace
   */
  async getUserWorkspace(userId: string): Promise<CoderWorkspace | null> {
    try {
      const response = await this.makeApiRequest(`/api/v2/workspaces?owner=${userId}`, 'GET', undefined, {
        'Coder-User-ID': userId,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get user workspace: ${response.statusText}`);
      }
      
      const data = await response.json();
      const workspaces = data.workspaces || [];
      
      if (workspaces.length === 0) {
        return null;
      }
      
      const ws = workspaces[0];
      return {
        id: ws.id,
        name: ws.name,
        url: ws.access_url || ws.url,
        status: ws.status,
        templateId: ws.template_id,
        createdAt: ws.created_at ? new Date(ws.created_at).getTime() : undefined,
        updatedAt: ws.updated_at ? new Date(ws.updated_at).getTime() : undefined,
      };
      
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to get user workspace:`, error);
      return null;
    }
  }

  /**
   * Get specific workspace by ID
   */
  async getWorkspace(userId: string, workspaceId: string): Promise<CoderWorkspace | null> {
    try {
      const response = await this.makeApiRequest(`/api/v2/workspaces/${workspaceId}`, 'GET', undefined, {
        'Coder-User-ID': userId,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get workspace: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        name: data.name,
        url: data.access_url || data.url,
        status: data.status,
        templateId: data.template_id,
        createdAt: data.created_at ? new Date(data.created_at).getTime() : undefined,
        updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : undefined,
      };
      
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to get workspace:`, error);
      return null;
    }
  }

  /**
   * Delete a workspace
   */
  async deleteWorkspace(userId: string, workspaceId: string): Promise<boolean> {
    try {
      const response = await this.makeApiRequest(`/api/v2/workspaces/${workspaceId}`, 'DELETE', undefined, {
        'Coder-User-ID': userId,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete workspace: ${response.statusText}`);
      }
      
      // Remove from Supabase
      await this.deleteWorkspaceFromStorage(userId, workspaceId);
      
      console.log(`[CoderAPIWrapper] Workspace deleted: ${workspaceId}`);
      return true;
      
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to delete workspace:`, error);
      return false;
    }
  }

  /**
   * Build rich parameter values for Coder API request
   */
  private buildRichParameterValues(userId: string, templateId: string, options: CreateWorkspaceOptions): Array<{ name: string; value: string }> {
    const richParameterValues: Array<{ name: string; value: string }> = [
      {
        name: 'cpu',
        value: String(options.cpu || 2),
      },
      {
        name: 'memory',
        value: String(options.memory || 4),
      },
      {
        name: 'home_disk_size',
        value: '20',
      },
    ];
    
    if (options.sshPublicKey) {
      richParameterValues.push({
        name: 'ssh_public_key',
        value: options.sshPublicKey,
      });
    }
    
    // Add environment variables
    if (options.image) {
      richParameterValues.push({
        name: 'image',
        value: options.image,
      });
    }
    
    // Add git configuration
    if (options.gitRepo) {
      richParameterValues.push({
        name: 'git_repository',
        value: options.gitRepo,
      });
      
      if (options.gitProvider) {
        richParameterValues.push({
          name: 'git_provider',
          value: options.gitProvider,
        });
      }
    }
    
    // Add template-specific parameters
    if (templateId === 'wonderspace-ide') {
      richParameterValues.push({
        name: 'environment',
        value: 'ai-wonderland',
      });
      
      richParameterValues.push({
        name: 'ai_tools_enabled',
        value: 'true',
      });
      
      richParameterValues.push({
        name: 'playcanvas_enabled',
        value: 'true',
      });
    }
    
    return richParameterValues;
  }

  /**
   * Make API request with proper error handling
   */
  private async makeApiRequest(
    endpoint: string,
    method: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<Response> {
    const url = `${this.baseApiUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    if (this.config.apiKey) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${this.config.apiKey}`,
      };
    }
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    options.signal = controller.signal;
    
    try {
      const response = await fetch(url, options);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Store workspace in Supabase for persistence and real-time updates
   */
  private async storeWorkspace(userId: string, workspace: CoderWorkspace): Promise<void> {
    try {
      await this.supabase
        .from('coder_workspaces')
        .upsert({
          user_id: userId,
          workspace_id: workspace.id,
          name: workspace.name,
          url: workspace.url,
          status: workspace.status,
          template_id: workspace.templateId,
          created_at: workspace.createdAt,
          updated_at: Date.now(),
          metadata: {
            source: 'coder_api_wrapper',
            api_url: this.config.apiUrl,
            environment: this.config.environment,
          }
        });
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to store workspace:`, error);
    }
  }

  /**
   * Update workspace in Supabase
   */
  private async updateWorkspace(userId: string, workspace: CoderWorkspace): Promise<void> {
    try {
      await this.supabase
        .from('coder_workspaces')
        .upsert({
          user_id: userId,
          workspace_id: workspace.id,
          name: workspace.name,
          url: workspace.url,
          status: workspace.status,
          template_id: workspace.templateId,
          created_at: workspace.createdAt,
          updated_at: workspace.updatedAt || Date.now(),
        });
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to update workspace:`, error);
    }
  }

  /**
   * Delete workspace from Supabase
   */
  private async deleteWorkspaceFromStorage(userId: string, workspaceId: string): Promise<void> {
    try {
      await this.supabase
        .from('coder_workspaces')
        .delete()
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId);
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to delete workspace from storage:`, error);
    }
  }

  /**
   * List all workspaces for a user
   */
  async listWorkspaces(userId: string): Promise<CoderWorkspace[]> {
    try {
      const response = await this.makeApiRequest(`/api/v2/workspaces?owner=${userId}`, 'GET', undefined, {
        'Coder-User-ID': userId,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to list workspaces: ${response.statusText}`);
      }
      
      const data = await response.json();
      const workspaces = data.workspaces || [];
      
      return workspaces.map((ws: any) => ({
        id: ws.id,
        name: ws.name,
        url: ws.access_url || ws.url,
        status: ws.status,
        templateId: ws.template_id,
        createdAt: ws.created_at ? new Date(ws.created_at).getTime() : undefined,
      }));
      
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to list workspaces:`, error);
      return [];
    }
  }

  /**
   * Get workspace logs or events
   */
  async getWorkspaceLogs(workspaceId: string, userId: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await this.makeApiRequest(`/api/v2/workspaces/${workspaceId}/logs?limit=${limit}`, 'GET', undefined, {
        'Coder-User-ID': userId,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get workspace logs: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to get workspace logs:`, error);
      return [];
    }
  }

  /**
   * Utility function to determine IDE URL based on template
   */
  buildIDEUrl(workspace: CoderWorkspace): string {
    if (workspace.templateId === 'wonderspace-ide') {
      // Use WonderSpace AI-powered IDE
      return `${workspace.url}/wonderspace`;
    }
    
    // Default to Coder IDE
    return `${workspace.url}/code-server`;
  }

  /**
   * Check if Coder API is reachable and healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeApiRequest('/api/v2/health', 'GET');
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default CoderAPIWrapper;
