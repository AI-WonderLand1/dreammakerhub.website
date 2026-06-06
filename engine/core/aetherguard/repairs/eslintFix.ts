import { execSync } from 'child_process';
import { RepairResult } from '../types';

export async function runEslintFix(workspaceRoot: string): Promise<RepairResult> {
  try {
    execSync('npx eslint . --fix', {
      cwd: workspaceRoot,
      timeout: 60000,
      stdio: 'pipe',
    });
    return {
      findingId: 'eslint-fix-all',
      success: true,
      description: 'ESLint auto-fix applied',
    };
  } catch (e: any) {
    return {
      findingId: 'eslint-fix-all',
      success: false,
      description: e.stderr?.slice(0, 200) || 'ESLint fix failed',
    };
  }
}

export async function runPrettier(workspaceRoot: string): Promise<RepairResult> {
  try {
    execSync('npx prettier --write .', {
      cwd: workspaceRoot,
      timeout: 60000,
      stdio: 'pipe',
    });
    return {
      findingId: 'prettier-fmt',
      success: true,
      description: 'Prettier formatting applied',
    };
  } catch (e: any) {
    return {
      findingId: 'prettier-fmt',
      success: false,
      description: e.stderr?.slice(0, 200) || 'Prettier failed',
    };
  }
}
