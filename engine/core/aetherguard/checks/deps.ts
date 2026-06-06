import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { CheckResult, SystemFinding } from '../types';

interface DepsState {
  deps: Record<string, string>;
  devDeps: Record<string, string>;
}

function readPackageJson(dir: string): DepsState | null {
  const path = join(dir, 'package.json');
  if (!existsSync(path)) return null;
  try {
    const pkg = JSON.parse(readFileSync(path, 'utf-8'));
    return {
      deps: pkg.dependencies || {},
      devDeps: pkg.devDependencies || {},
    };
  } catch {
    return null;
  }
}

export async function checkDeps(workspaceRoot: string): Promise<CheckResult> {
  const start = Date.now();
  const findings: SystemFinding[] = [];

  const rootPkg = readPackageJson(workspaceRoot);
  if (!rootPkg) {
    return { checkName: 'deps', passed: true, findings: [], durationMs: Date.now() - start };
  }

  const allDeps = { ...rootPkg.deps, ...rootPkg.devDeps };
  for (const [pkg, version] of Object.entries(allDeps)) {
    if (version.startsWith('workspace:')) continue;
    if (version === '*' || version === 'latest') {
      findings.push({
        id: `deps-pin-${pkg}`,
        check: 'deps',
        severity: 'info',
        title: `Unpinned dependency: ${pkg}`,
        description: `${pkg} is set to "${version}" — pin to a specific version`,
        autoFixable: false,
        timestamp: Date.now(),
      });
    }
  }

  return {
    checkName: 'deps',
    passed: findings.length === 0,
    findings,
    durationMs: Date.now() - start,
  };
}
