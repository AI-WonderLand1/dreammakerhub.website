export type Language = 'typescript' | 'javascript' | 'css' | 'html' | 'json' | 'text';

export interface VirtualFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: Language;
}

export interface VulnerabilityRisk {
  id: string;
  line: number;
  level: 'critical' | 'warning' | 'info';
  vulnerabilityType: string;
  description: string;
  remediation: string;
  oldCode: string;
  newCode: string;
  category: 'security' | 'vulnerability' | 'bug' | 'performance_leak';
}

export interface PatternSummaryItem {
  id: string;
  title: string;
  description: string;
  category: 'architectural' | 'naming' | 'styling' | 'error-handling' | 'security';
  confidence: 'high' | 'medium' | 'low';
  snippet?: string;
}

export interface AuditResult {
  vulnerabilities: VulnerabilityRisk[];
  patterns: PatternSummaryItem[];
  timestamp: number;
}

export interface SystemFinding {
  id: string;
  check: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  filePath?: string;
  line?: number;
  autoFixable: boolean;
  fixSuggestion?: string;
  timestamp: number;
}

export interface CheckResult {
  checkName: string;
  passed: boolean;
  findings: SystemFinding[];
  durationMs: number;
}

export interface RepairResult {
  findingId: string;
  success: boolean;
  description: string;
}

export type CheckCategory = 'fast' | 'medium' | 'slow' | 'daily';

export interface CheckDefinition {
  name: string;
  category: CheckCategory;
  run: () => Promise<CheckResult>;
}
