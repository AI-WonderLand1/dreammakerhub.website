export type {
  Language,
  VirtualFile,
  VulnerabilityRisk,
  PatternSummaryItem,
  AuditResult,
  SystemFinding,
  CheckResult,
  RepairResult,
  CheckDefinition,
  CheckCategory,
} from './types';

export { walkDir, readTargetFile, writeTargetFile, sanitizeContent, assembleRepoContentPrompt } from './scanner';
export { analyzeCode, explainPatch } from './analyzer';
export { applyVulnerabilityFix, applyFixesForFindings, getAutoFixLog } from './autofix';
export { setupFileWatcher, closeFileWatcher } from './watcher';
export { startDaemon, stopDaemon, getStats, isDaemonRunning } from './daemon';
export type { DaemonStats, FixEntry } from './daemon';
