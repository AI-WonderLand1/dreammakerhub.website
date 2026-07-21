import { NextResponse } from 'next/server';
import { checkEslint } from '@/core/aetherguard/checks/eslint';
import { checkTypeScript } from '@/core/aetherguard/checks/typecheck';
import { checkDeps } from '@/core/aetherguard/checks/deps';
import { checkDeadCode } from '@/core/aetherguard/checks/deadcode';
import { logger } from '@/lib/logger';

export async function GET() {
  const cwd = process.cwd();
  const results = await Promise.allSettled([
    checkEslint(cwd),
    checkTypeScript(cwd),
    checkDeps(cwd),
    checkDeadCode(cwd),
  ]);

  const checks = results.map((r, i) => {
    const names = ['eslint', 'typecheck', 'deps', 'deadcode'];
    if (r.status === 'fulfilled') return r.value;
    return { checkName: names[i], passed: false, findings: [], durationMs: 0, error: r.reason?.message };
  });

  return NextResponse.json({ checks });
}
