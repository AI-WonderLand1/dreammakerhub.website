import { CheckResult, SystemFinding } from '../types';

interface MemWarning {
  id: string;
  severity: 'high' | 'low';
  message: string;
  detail?: string;
  file?: string;
  line?: number;
}

async function checkForMemoryPatterns(workspaceRoot: string): Promise<MemWarning[]> {
  const warnings: MemWarning[] = [];
  const { join } = await import('path');

  const filesToCheck = [
    join(workspaceRoot, 'engine/core'),
    join(workspaceRoot, 'runners'),
  ];

  for (const dir of filesToCheck) {
    const { existsSync, readFileSync } = await import('fs');
    if (!existsSync(dir)) continue;
    try {
      const files = await getTSFiles(dir);
      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('setInterval') || line.includes('setTimeout')) {
            if (!content.includes('clearInterval') && !content.includes('clearTimeout')) {
              warnings.push({
                id: `mem-timer-${file}-${i}`,
                severity: 'low',
                message: 'Timer without cleanup',
                detail: `setInterval/setTimeout found without corresponding clearInterval/clearTimeout`,
                file: file.replace(workspaceRoot, ''),
                line: i + 1,
              });
            }
          }
          if (line.includes('.on(') && !content.includes('removeListener') && !content.includes('.off(')) {
            warnings.push({
              id: `mem-listener-${file}-${i}`,
              severity: 'low',
              message: 'Event listener without cleanup',
              detail: 'Event listener attached without corresponding removal',
              file: file.replace(workspaceRoot, ''),
              line: i + 1,
            });
          }
        }
      }
    } catch {
      // skip
    }
  }

  return warnings;
}

async function getTSFiles(dir: string): Promise<string[]> {
  const { readdirSync, statSync } = await import('fs');
  const results: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        results.push(...await getTSFiles(full));
      }
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

export async function checkMemoryLeaks(workspaceRoot: string): Promise<CheckResult> {
  const start = Date.now();
  const findings: SystemFinding[] = [];

  try {
    const warnings = await checkForMemoryPatterns(workspaceRoot);
    for (const w of warnings) {
      findings.push({
        id: w.id,
        check: 'memory',
        severity: w.severity === 'high' ? 'warning' : 'info',
        title: w.message,
        description: w.detail || w.message,
        filePath: w.file,
        line: w.line,
        autoFixable: false,
        timestamp: Date.now(),
      });
    }
  } catch {
    // memory check not critical
  }

  return {
    checkName: 'memory',
    passed: findings.length === 0,
    findings,
    durationMs: Date.now() - start,
  };
}
