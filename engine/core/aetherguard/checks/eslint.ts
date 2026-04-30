import { exec } from 'child_process';
import { promisify } from 'util';
import { CheckResult, SystemFinding } from '../types';

const execAsync = promisify(exec);

export async function checkEslint(workspaceRoot: string): Promise<CheckResult> {
  const start = Date.now();
  const findings: SystemFinding[] = [];

  try {
    const { stdout } = await execAsync('npx eslint . --format json', {
      cwd: workspaceRoot,
      timeout: 30000,
      encoding: 'utf-8',
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
    const err = e as { stdout?: string };
    if (err.stdout) {
      try {
        const results = JSON.parse(err.stdout.trim());
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
