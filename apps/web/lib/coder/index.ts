import { logger } from '@/lib/logger';
// Coder Integration Module Exports

export { default as CoderAPIWrapper } from './api-wrapper';
export { createSupabaseClient } from './supabase-client';
export { getUserSSHKey, getUserSSHPublicKey } from './user-ssh-keys';

// Types
export type { 
  CoderAPIConfig,
  CoderWorkspace,
  CreateWorkspaceRequest,
  ProvisionResult 
} from './types';