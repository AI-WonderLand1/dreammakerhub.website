// Coder API Type Definitions
// Matches official codersdk.Workspace interface with simplified fields

export type CoderWorkspaceStatus = 
  | 'starting' 
  | 'running' 
  | 'stopping' 
  | 'stopped' 
  | 'failed' 
  | 'deleting' 
  | 'deleted' 
  | 'canceling' 
  | 'canceled' 
  | 'pending' 
  | 'idle';

export type AppWorkspaceStatus = 'idle' | 'provisioning' | 'running' | 'stopped' | 'error';

export interface CoderWorkspaceHealth {
  healthy: boolean;
  failing_agents: string[];
}

export interface WorkspaceApp {
  id: string;
  slug: string;
  display_name: string;
  icon: string;
  access_url: string;
}

export interface CoderWorkspaceBuild {
  id: string;
  build_number: number;
  status: CoderWorkspaceStatus;
  started_at: string;
  finished_at: string;
  resources: any[]; // WorkspaceResource
  creator_id: string;
  template_version_id: string;
  has_ai_task: boolean;
}

export interface CoderWorkspace {
  // Core fields
  id: string;
  name: string;
  
  // Ownership and access
  owner_id: string;
  owner_name: string;
  owner_avatar_url: string;
  
  // Workspace configuration
  template_id: string;
  template_name: string;
  template_version_id: string;
  template_display_name: string;
  template_icon: string;
  
  // Status and lifecycle
  status: CoderWorkspaceStatus;
  health: CoderWorkspaceHealth;
  last_used_at: string;
  next_start_at: string;
  deleting_at: string; // null if not deleting
  dormant_at: string; // null if not dormant
  
  // Resources and apps
  latest_build: CoderWorkspaceBuild;
  latest_app_status: WorkspaceAppStatus;
  
  // Access and connectivity
  url: string; // Construct from CODER_ACCESS_URL + workspace name
  
  // Utility fields
  created_at: string;
  updated_at: string;
  ttl_ms: number;
  organization_id: string;
  organization_name: string;
}

export interface CreateWorkspaceRequest {
  automatic_updates?: "always" | "never";
  autostart_schedule?: string;
  name: string;                           // REQUIRED. Max 32 chars, letters/numbers/hyphens only
  rich_parameter_values?: Array<{ name: string; value: string }>;
  template_id?: string;                   // UUID - specify this OR template_version_id, not both
  template_version_id?: string;           // UUID
  template_version_preset_id?: string;
  ttl_ms?: number;
}

export interface ProvisionOptions {
  customName?: string;
  sshPublicKey?: string;
  templateId?: string;
  cpu?: number;
  memory?: number;
}

export interface WorkspaceConfig {
  name: string;
  type: "full" | "ide" | "playcanvas";
  projectId?: string;
  cpu: number;
  memory: number;
}