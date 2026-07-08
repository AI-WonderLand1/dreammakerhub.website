// Coder API Client
// Unified interface to Coder API with proper error handling and URL construction

import crypto from 'crypto';
import { createSupabaseClient } from './supabase-client';
import type { CoderWorkspace, CoderWorkspaceHealth, CreateWorkspaceRequest, ProvisionOptions, AppWorkspaceStatus } from './types';

export interface CoderAPIConfig {
  apiUrl: string;
  apiKey?: string;
  userId?: string;
  environment?: 'production' | 'development' | 'staging';
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
  private supabase: ReturnType<typeof createSupabaseClient>;
  private baseApiUrl: string;
  private CODER_ACCESS_URL: string;
  private CODER_WILDCARD_ACCESS_URL: string;
  
  constructor(config: CoderAPIConfig) {
    this.config = config;
    this.baseApiUrl = config.apiUrl.replace(/\/$/, '');
    
    // Get environment variables for URL construction
    this.CODER_ACCESS_URL = process.env.CODER_ACCESS_URL || config.apiUrl.replace('/api/v2', '');
    this.CODER_WILDCARD_ACCESS_URL = process.env.CODER_WILDCARD_ACCESS_URL || 
      this.CODER_ACCESS_URL.replace(/\/api\/v2$/, '');
    
    // Initialize Supabase for workspace persistence
    this.supabase = createSupabaseClient();
    
    console.log(`[CoderAPIWrapper] Initialized with baseUrl: ${this.baseApiUrl}`);
    console.log(`[CoderAPIWrapper] CODER_ACCESS_URL: ${this.CODER_ACCESS_URL}`);
  }

  /**
   * Create a new Coder workspace for a user
   * Supports Coder IDE and WonderSpace IDE templates
   */
  async createWorkspace(userId: string, options: CreateWorkspaceRequest): Promise<CoderWorkspace> {
    // Generate workspace ID
    const workspaceId = crypto.randomUUID();
    const timestamp = Date.now();
    
    try {
      // Make request to Coder API
      const response = await this.makeApiRequest('/api/v2/workspaces', 'POST', options, {
        'Coder-User-ID': userId,
        'Content-Type': 'application/json',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Coder API error: ${errorData.error || response.statusText}`);
      }
      
      const coderWorkspace = await response.json();
      
      // Construct the workspace URL using official Coder URL pattern
      const workspaceUrl = this.buildWorkspaceUrl(coderWorkspace.name);
      
      // Store workspace metadata in Supabase for persistence
      const workspaceData: CoderWorkspace = {
        id: workspaceId,
        name: options.name,
        owner_id: userId,
        owner_name: userId, // Could be populated if available
        owner_avatar_url: '',
        template_id: coderWorkspace.template_id || options.template_id || '',
        template_name: 'wonderspace-ide',
        template_version_id: coderWorkspace.template_version_id || '',
        template_display_name: 'WonderSpace IDE',
        template_icon: '',
        status: 'starting', // Initial status from API
        health: { healthy: true, failing_agents: [] },
        last_used_at: '',
        next_start_at: '',
        deleting_at: '',
        dormant_at: '',
        latest_build: coderWorkspace.latest_build,
        latest_app_status: 'provisioning',
        url: workspaceUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ttl_ms: options.ttl_ms || 0,
        organization_id: userId,
        organization_name: 'DreamMakerHub',
      };
      
      // Store in Supabase for real-time updates
      await this.storeWorkspace(userId, workspaceData);
      
      // Poll for workspace to be ready
      await this.waitForWorkspaceReady(workspaceId, userId, 60000);
      
      // Update status to running
      workspaceData.status = 'running';
      workspaceData.latest_app_status = 'running';
      workspaceData.updated_at = new Date().toISOString();
      await this.updateWorkspace(userId, workspaceData);
      
      console.log(`[CoderAPIWrapper] Workspace created successfully: ${options.name} (${workspaceId})`);
      return workspaceData;
      
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to create workspace:`, error);
      
      // Store error state
      await this.storeWorkspace(userId, {
        id: workspaceId,
        name: options.name,
        owner_id: userId,
        owner_name: userId,
        owner_avatar_url: '',
        template_id: options.template_id || '',
        template_name: 'wonderspace-ide',
        template_version_id: '',
        template_display_name: 'WonderSpace IDE',
        template_icon: '',
        status: 'failed',
        health: { healthy: false, failing_agents: [] },
        last_used_at: '',
        next_start_at: '',
        deleting_at: '',
        dormant_at: '',
        latest_build: { id: '', build_number: 0, status: 'failed', started_at: '', finished_at: '', resources: [], creator_id: '', template_version_id: '', has_ai_task: false },
        latest_app_status: 'error',
        url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ttl_ms: 0,
        organization_id: userId,
        organization_name: 'DreamMakerHub',
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
        
        if (workspace.status === 'failed' || workspace.status === 'error') {
          throw new Error(`Workspace failed: ${workspaceId}`);
        }
        
        // Still starting, wait and retry
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
      return this.parseWorkspaceResponse(ws, userId);
      
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
      
      return this.parseWorkspaceResponse(data, userId);
      
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to get workspace:`, error);
      return null;
    }
  }

  /**
   * Parse Coder API response into our standardized workspace format
   */
  private parseWorkspaceResponse(coderWorkspace: any, userId: string): CoderWorkspace {
    // Construct the workspace URL using official Coder URL pattern
    const workspaceUrl = this.buildWorkspaceUrl(coderWorkspace.name);
    
    return {
      id: coderWorkspace.id,
      name: coderWorkspace.name,
      owner_id: coderWorkspace.owner_id || userId,
      owner_name: coderWorkspace.owner_name || coderWorkspace.owner_id || userId,
      owner_avatar_url: coderWorkspace.owner_avatar_url || '',
      template_id: coderWorkspace.template_id,
      template_name: coderWorkspace.template_name || 'wonderspace-ide',
      template_version_id: coderWorkspace.template_version_id || '',
      template_display_name: 'WonderSpace IDE',
      template_icon: '',
      status: coderWorkspace.status,
      health: coderWorkspace.health || { healthy: true, failing_agents: [] },
      last_used_at: coderWorkspace.last_used_at || '',
      next_start_at: coderWorkspace.next_start_at || '',
      deleting_at: coderWorkspace.deleting_at || '',
      dormant_at: coderWorkspace.dormant_at || '',
      latest_build: coderWorkspace.latest_build,
      latest_app_status: this.mapStatusToAppStatus(coderWorkspace.status),
      url: workspaceUrl,
      created_at: coderWorkspace.created_at,
      updated_at: coderWorkspace.updated_at,
      ttl_ms: coderWorkspace.ttl_ms || 0,
      organization_id: coderWorkspace.organization_id || userId,
      organization_name: coderWorkspace.organization_name || 'DreamMakerHub',
    };
  }

  /**
   * Build workspace URL using official Coder URL pattern
   */
  buildWorkspaceUrl(workspaceName: string): string {
    // Construct URL based on template and workspace name
    return `${this.CODER_ACCESS_URL}/${workspaceName}`;
  }

  /**
   * Build IDE URL that redirects to Coder workspace
   */
  buildIDEUrl(workspace: CoderWorkspace): string {
    if (workspace.template_id === 'wonderspace-ide') {
      // Use WonderSpace AI-powered IDE
      return `${workspace.url}/wonderspace`;
    }
    
    // Default to Coder IDE
    return `${workspace.url}/code-server`;
  }

  /**
   * Start a workspace
   */
  async startWorkspace(userId: string, workspaceId: string): Promise<CoderWorkspace> {
    try {
      const response = await this.makeApiRequest(`/api/v2/workspaces/${workspaceId}/start`, 'POST', undefined, {
        'Coder-User-ID': userId,
        'Content-Type': 'application/json',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start workspace: ${response.statusText}`);
      }
      
      const updatedWorkspace = await response.json();
      return this.parseWorkspaceResponse(updatedWorkspace, userId);
      
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to start workspace:`, error);
      throw error;
    }
  }

  /**
   * Stop a workspace
   */
  async stopWorkspace(userId: string, workspaceId: string): Promise<CoderWorkspace> {
    try {
      const response = await this.makeApiRequest(`/api/v2/workspaces/${workspaceId}/stop`, 'POST', undefined, {
        'Coder-User-ID': userId,
        'Content-Type': 'application/json',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to stop workspace: ${response.statusText}`);
      }
      
      const updatedWorkspace = await response.json();
      return this.parseWorkspaceResponse(updatedWorkspace, userId);
      
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to stop workspace:`, error);
      throw error;
    }
  }

  /**
   * Restart a workspace
   */
  async restartWorkspace(userId: string, workspaceId: string): Promise<CoderWorkspace> {
    try {
      // Stop then start
      const stopped = await this.stopWorkspace(userId, workspaceId);
      return await this.startWorkspace(userId, workspaceId);
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to restart workspace:`, error);
      throw error;
    }
  }

  /**
   * Get workspace health status
   */
  async getWorkspaceHealth(userId: string, workspaceId: string): Promise<CoderWorkspaceHealth | null> {
    try {
      const response = await this.makeApiRequest(`/api/v2/workspaces/${workspaceId}/health`, 'GET', undefined, {
        'Coder-User-ID': userId,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get workspace health: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to get workspace health:`, error);
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
      
      return workspaces.map((ws: any) => this.parseWorkspaceResponse(ws, userId));
      
    } catch (error) {
      console.error(`[CoderAPIWrapper] Failed to list workspaces:`, error);
      return [];
    }
  }

  /**
   * Map Coder workspace status to app status
   */
  private mapStatusToAppStatus(coderStatus: string): AppWorkspaceStatus {
    switch (coderStatus) {
      case 'running':
      case 'start_error':
        return 'running';
      case 'stopped':
      case 'stopping':
        return 'stopped';
      case 'failed':
      case 'error':
        return 'error';
      case 'pending':
      case 'starting':
        return 'provisioning';
      default:
        return 'idle';
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
          template_id: workspace.template_id,
          created_at: workspace.created_at,
          updated_at: workspace.updated_at,
          metadata: {
            source: 'coder_api_wrapper',
            owner_id: workspace.owner_id,
            template_name: workspace.template_name,
            health: workspace.health,
            latest_build: workspace.latest_build,
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
          template_id: workspace.template_id,
          created_at: workspace.created_at,
          updated_at: workspace.updated_at,
          metadata: {
            source: 'coder_api_wrapper',
            owner_id: workspace.owner_id,
            template_name: workspace.template_name,
            health: workspace.health,
            latest_build: workspace.latest_build,
          }
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

  /**
   * Utility function to create ProvisionResult for backward compatibility
   */
  async createWorkspaceForApp(userId: string, options: ProvisionOptions): Promise<ProvisionResult> {
    const workspace = await this.createWorkspace(userId, {
      name: options.customName || `ai-wonder-space-${userId}-${Date.now().toString().slice(-6)}`,
      template_id: options.templateId || 'wonderspace-ide',
      rich_parameter_values: this.buildRichParameterValues(userId, options.templateId || 'wonderspace-ide', options),
      ttl_ms: 4 * 60 * 60 * 1000, // 4 hours
    });
    
    const ideUrl = this.buildIDEUrl(workspace);
    const sshCommand = `ssh coder@${this.extractHostname(ideUrl)}`;
    
    return {
      workspace,
      ideUrl,
      sshCommand,
      status: 'success',
    };
  }

  /**
   * Build rich parameter values for Coder API request
   */
  private buildRichParameterValues(userId: string, templateId: string, options: ProvisionOptions): Array<{ name: string; value: string }> {
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
    
    if (options.templateId === 'wonderspace-ide') {
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
   * Extract hostname from URL for SSH command
   */
  private extractHostname(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'coder'; // Default hostname
    }
  }
}

export default CoderAPIWrapper;