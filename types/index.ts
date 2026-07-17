export type ProjectMetadata = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  owner: string;
  status: 'active' | 'archived' | 'deleted';
  visibility: 'public' | 'private';
};

export type BuildCodeGenPromptArgs = {
  agentId: string;
  input: string;
  outputFormat: 'text' | 'puck';
  context: string[];
  temperature?: number;
  maxTokens?: number;
};

export type Platform = 'web' | 'cmd' | 'docker' | 'browser';

export type AgentName = 'builder' | 'github' | 'google' | 'general' | 'openrouter';

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type WorkspaceConfig = {
  cpu: number;
  memory: string;
  gpu?: number;
  editor: 'vscode' | 'theia' | 'playcanvas' | 'unreal';
  ports: number[];
  volumes: Record<string, string>;
};

export type AuthResult = {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'maintainer';
  permissions: string[];
};