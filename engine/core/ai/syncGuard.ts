export type WorkspaceMode = 'puck' | 'ide';

export type SyncAction =
  | 'puck:update-layout-json'
  | 'ide:write-source-files'
  | 'engine:rebuild-package'
  | 'orchestrator:sync';

export type SyncGuardDecision = {
  allowed: boolean;
  reason?: string;
};

export function evaluateSyncGuard(mode: WorkspaceMode, action: SyncAction): SyncGuardDecision {
  if (mode === 'puck' && action === 'ide:write-source-files') {
    return {
      allowed: false,
      reason: 'Blocked by Sync Guard: switch to Code Mode before writing source files.',
    };
  }

  if (mode === 'ide' && action === 'puck:update-layout-json') {
    return {
      allowed: false,
      reason: 'Blocked by Sync Guard: switch to Puck Mode before mutating layout state.',
    };
  }

  return { allowed: true };
}
