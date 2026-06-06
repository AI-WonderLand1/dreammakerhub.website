import { execSync } from 'child_process';
import { RepairResult } from '../types';

export async function updateDependencies(workspaceRoot: string): Promise<RepairResult> {
  try {
    execSync('npm update', {
      cwd: workspaceRoot,
      timeout: 120000,
      stdio: 'pipe',
    });
    return {
      findingId: 'npm-update',
      success: true,
      description: 'Dependencies updated',
    };
  } catch (e: any) {
    return {
      findingId: 'npm-update',
      success: false,
      description: e.stderr?.slice(0, 200) || 'npm update failed',
    };
  }
}

export async function fixDepIssues(workspaceRoot: string): Promise<RepairResult> {
  try {
    execSync('npm audit fix', {
      cwd: workspaceRoot,
      timeout: 60000,
      stdio: 'pipe',
    });
    return {
      findingId: 'npm-audit-fix',
      success: true,
      description: 'npm audit fix applied',
    };
  } catch (e: any) {
    return {
      findingId: 'npm-audit-fix',
      success: false,
      description: e.stderr?.slice(0, 200) || 'npm audit fix failed',
    };
  }
}
