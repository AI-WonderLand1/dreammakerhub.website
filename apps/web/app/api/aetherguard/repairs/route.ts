import { NextResponse } from 'next/server';
import { runEslintFix, runPrettier } from '@/core/aetherguard/repairs';
import { updateDependencies, fixDepIssues } from '@/core/aetherguard/repairs';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  const cwd = process.cwd();

  switch (action) {
    case 'eslint-fix':
      return NextResponse.json(await runEslintFix(cwd));
    case 'prettier':
      return NextResponse.json(await runPrettier(cwd));
    case 'npm-update':
      return NextResponse.json(await updateDependencies(cwd));
    case 'npm-audit-fix':
      return NextResponse.json(await fixDepIssues(cwd));
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
