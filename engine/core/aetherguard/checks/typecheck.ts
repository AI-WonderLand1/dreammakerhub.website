import { execSync } from 'child_process';
import { CheckResult, SystemFinding } from '../types';

export async function checkTypeScript(workspaceRoot: string): Promise<CheckResult> {
  const start = Date.now();
  const findings: SystemFinding[] = [];

  try {
    execSync('npx tsc --noEmit 2>&1', {
      cwd: workspaceRoot,
      timeout: 60000,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    // no errors
  } catch (e: unknown) {
    const err = e as { stderr?: string; stdout?: string };
    const output = err.stderr || err.stdout || '';
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/^(.+)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
      if (match) {
        findings.push({
          id: `tsc-${match[1]}-${match[2]}`,
          check: 'typecheck',
          severity: 'warning',
          title: match[5],
          description: `${match[5]} (${match[4]})`,
          filePath: match[1],
          line: parseInt(match[2]),
          autoFixable: false,
          timestamp: Date.now(),
        });
      }
    }
  }

  return {
    checkName: 'typecheck',
    passed: findings.length === 0,
    findings,
    durationMs: Date.now() - start,
  };
}
