import { execSync } from 'child_process';
import { CheckResult, SystemFinding } from '../types';

export async function checkEslint(workspaceRoot: string): Promise<CheckResult> {
  const start = Date.now();
  const findings: SystemFinding[] = [];

  try {
    const stdout = execSync('npx eslint . --format json', {
      cwd: workspaceRoot,
      timeout: 30000,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const results = JSON.parse(stdout.trim());
    for (const file of results) {
      for (const msg of file.messages) {
        findings.push({
          id: `eslint-${file.filePath}-${msg.line}-${msg.column}`,
          check: 'eslint',
          severity: msg.severity === 2 ? 'warning' : 'info',
          title: msg.message,
          description: `${msg.message} (${msg.ruleId || 'unknown'})`,
          filePath: file.filePath,
          line: msg.line,
          autoFixable: !!msg.fix,
          timestamp: Date.now(),
        });
      }
    }
  } catch (e: unknown) {
    if (e.stdout) {
      try {
        const results = JSON.parse(e.stdout.trim());
        for (const file of results) {
          for (const msg of file.messages) {
            findings.push({
              id: `eslint-${file.filePath}-${msg.line}-${msg.column}`,
              check: 'eslint',
              severity: msg.severity === 2 ? 'warning' : 'info',
              title: msg.message,
              description: `${msg.message} (${msg.ruleId || 'unknown'})`,
              filePath: file.filePath,
              line: msg.line,
              autoFixable: !!msg.fix,
              timestamp: Date.now(),
            });
          }
        }
      } catch { }
    }
  }

  return {
    checkName: 'eslint',
    passed: findings.length === 0,
    findings,
    durationMs: Date.now() - start,
  };
}
