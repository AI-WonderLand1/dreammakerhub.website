import { VulnerabilityRisk, SystemFinding } from "./types";
import { readTargetFile, writeTargetFile } from "./scanner";

export interface FixEntry {
  timestamp: string;
  vulnerabilityType: string;
  file: string;
  line: number;
  description: string;
  applied: boolean;
}

const MAX_LOG = 200;
const autoFixLog: FixEntry[] = [];

export function getAutoFixLog(): FixEntry[] {
  return [...autoFixLog];
}

function addEntry(entry: FixEntry) {
  autoFixLog.push(entry);
  if (autoFixLog.length > MAX_LOG) autoFixLog.splice(0, autoFixLog.length - MAX_LOG);
}

export function applyVulnerabilityFix(
  vuln: VulnerabilityRisk,
  baseDir: string
): boolean {
  if (!vuln.oldCode || !vuln.newCode || !vuln.file) return false;

  const fileContent = readTargetFile(baseDir, vuln.file);
  if (fileContent === null) return false;

  const lines = fileContent.split('\n');
  const targetLine = vuln.line - 1;
  if (targetLine < 0 || targetLine >= lines.length) return false;

  const oldLineCount = vuln.oldCode.split('\n').length;
  const newLines = vuln.newCode.split('\n');
  const endLine = Math.min(targetLine + oldLineCount, lines.length);

  if (lines.slice(targetLine, endLine).join('\n').trim() !== vuln.oldCode.trim()) {
    return false;
  }

  lines.splice(targetLine, oldLineCount, ...newLines);
  const applied = writeTargetFile(baseDir, vuln.file, lines.join('\n'));

  addEntry({
    timestamp: new Date().toISOString(),
    vulnerabilityType: vuln.vulnerabilityType,
    file: vuln.file,
    line: vuln.line,
    description: vuln.description,
    applied,
  });

  return applied;
}

export function applyFixesForFindings(
  findings: SystemFinding[],
  baseDir: string
): { applied: number; failed: number } {
  let applied = 0;
  let failed = 0;

  for (const finding of findings) {
    if (!finding.autoFixable || !finding.fixSuggestion) continue;
    try {
      const applied_ok = applyVulnerabilityFix(
        {
          id: finding.id,
          line: finding.line ?? 1,
          level: finding.severity === 'critical' ? 'critical' : 'warning',
          vulnerabilityType: finding.check,
          description: finding.description,
          remediation: finding.fixSuggestion,
          oldCode: '',
          newCode: finding.fixSuggestion,
          category: 'bug',
        },
        baseDir
      );
      if (applied_ok) applied++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return { applied, failed };
}
