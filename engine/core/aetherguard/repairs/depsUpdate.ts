import { execFile } from 'child_process';
import { promisify } from 'util';
import { RepairResult } from '../types';

const execFileAsync = promisify(execFile);

export async function updateDependencies(workspaceRoot: string): Promise<RepairResult> {
  try {
    await execFileAsync('npm', ['update'], {
      cwd: workspaceRoot,
      timeout: 120000,
    });
    return {
      findingId: 'npm-update',
      success: true,
      description: 'Dependencies updated',
    };
  } catch (e: unknown) {
    const err = e as { stderr?: string };
    return {
      findingId: 'npm-update',
      success: false,
      description: err.stderr?.slice(0, 200) || 'npm update failed',
    };
  }
}

export async function fixDepIssues(workspaceRoot: string): Promise<RepairResult> {
  try {
    await execFileAsync('npm', ['audit', 'fix'], {
      cwd: workspaceRoot,
      timeout: 60000,
    });
    return {
      findingId: 'npm-audit-fix',
      success: true,
      description: 'npm audit fix applied',
    };
  } catch (e: unknown) {
    const err = e as { stderr?: string };
    return {
      findingId: 'npm-audit-fix',
      success: false,
      description: err.stderr?.slice(0, 200) || 'npm audit fix failed',
    };
  }
}
