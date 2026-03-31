/**
 * SyncGuard: Prevents the AI from touching the core logic that gives it life.
 * We don't need a recursive AI loop *burp* unless I say so, Morty.
 */

const PROTECTED_PATHS = [
  'engine/core/ai/',
  '.github/',
  '.gitlab-ci.yml',
  'package.json',
  'infra/k8s/',
  'config/ai/'
];

export function isPathProtected(path: string): boolean {
  return PROTECTED_PATHS.some(protectedPath => path.startsWith(protectedPath));
}

export function validateWriteAction(path: string): void {
  if (isPathProtected(path)) {
    throw new Error(`REJECTED_ACTION: Attempted to modify protected core file: ${path}. Self-replication is strictly forbidden by the Council of Ricks.`);
  }
}