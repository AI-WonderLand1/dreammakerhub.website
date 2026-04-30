import { exec } from 'child_process';
import { promisify } from 'util';
import { CheckResult, SystemFinding } from '../types';

const execAsync = promisify(exec);

export async function checkDeadCode(workspaceRoot: string): Promise<CheckResult> {
  const start = Date.now();
  const findings: SystemFinding[] = [];

  try {
    const { stdout } = await execAsync('npx ts-prune', {
      cwd: workspaceRoot,
      timeout: 30000,
      encoding: 'utf-8',
    });
    const lines = stdout.split('\n').filter(l => l.trim() && !l.includes('✨'));
    for (const line of lines) {
      const match = line.match(/^(.+) (\S+)$/);
      if (match) {
        findings.push({
          id: `deadcode-${match[1].replace(/[/\\:]/g, '-')}`,
          check: 'deadcode',
          severity: 'info',
          title: `Unused export: ${match[2]}`,
          description: `${match[2]} in ${match[1]} is not used`,
          filePath: match[1],
          autoFixable: false,
          timestamp: Date.now(),
        });
      }
    }
  } catch {
    // ts-prune not available or not configured
  }

  return {
    checkName: 'deadcode',
    passed: findings.length === 0,
    findings,
    durationMs: Date.now() - start,
  };
}
