import { logger } from '@/lib/logger';
import { setupFileWatcher, closeFileWatcher } from './watcher';
import { runEslintFix, runPrettier, updateDependencies, fixDepIssues } from './repairs';
import {
  FAST_INTERVAL_MS,
  MEDIUM_INTERVAL_MS,
  SLOW_INTERVAL_MS,
  DAILY_INTERVAL_MS,
} from './constants';
import { CheckResult, RepairResult } from './types';

const log = logger;

export interface DaemonStats {
  uptime: number;
  checksRun: number;
  repairsApplied: number;
  lastCheckTime: number | null;
  lastRepairTime: number | null;
  isRunning: boolean;
  recentFindings: number;
}

let isRunning = false;
let startTime = 0;
let checksRun = 0;
let repairsApplied = 0;
let lastCheckTime: number | null = null;
let lastRepairTime: number | null = null;
let recentFindings = 0;
const timers: ReturnType<typeof setInterval>[] = [];

export function getStats(): DaemonStats {
  return {
    uptime: isRunning ? Date.now() - startTime : 0,
    checksRun,
    repairsApplied,
    lastCheckTime,
    lastRepairTime,
    isRunning,
    recentFindings,
  };
}

async function runCheck(
  name: string,
  checkFn: () => Promise<CheckResult>,
  repairs: (() => Promise<RepairResult>)[],
): Promise<void> {
  log.info(`Running check: ${name}`);
  try {
    const result = await checkFn();
    checksRun++;
    lastCheckTime = Date.now();
    recentFindings = result.findings.length;

    if (!result.passed && result.findings.length > 0) {
      log.warn(`${name}: ${result.findings.length} finding(s)`);
      for (const repair of repairs) {
        const repairResult = await repair();
        if (repairResult.success) {
          repairsApplied++;
          lastRepairTime = Date.now();
          log.info(`Repair applied: ${repairResult.description}`);
        }
      }
    } else {
      log.info(`${name}: passed`);
    }
  } catch (e) {
    log.error(`Check ${name} failed`, e);
  }
}

async function fullCheck(): Promise<void> {
  const { checkEslint } = await import('./checks/eslint');
  const { checkTypeScript } = await import('./checks/typecheck');
  const { checkDeps } = await import('./checks/deps');

  await runCheck('eslint', () => checkEslint(process.cwd()), [() => runEslintFix(process.cwd())]);
  await runCheck('typescript', () => checkTypeScript(process.cwd()), []);
  await runCheck('deps', () => checkDeps(process.cwd()), [
    () => fixDepIssues(process.cwd()),
    () => updateDependencies(process.cwd()),
  ]);
}

async function slowCheck(): Promise<void> {
  const { checkDeadCode } = await import('./checks/deadcode');
  await runCheck('deadcode', () => checkDeadCode(process.cwd()), []);
}

async function dailyCheck(): Promise<void> {
  const { checkMemoryLeaks } = await import('./checks/memory');
  await runCheck('memory-leaks', () => checkMemoryLeaks(process.cwd()), []);
  await runCheck('prettier', async () => ({
    checkName: 'prettier',
    passed: true,
    findings: [],
    durationMs: 0,
  }), [() => runPrettier(process.cwd())]);
}

function scheduleCheck(interval: number, fn: () => Promise<void>) {
  timers.push(setInterval(fn, interval));
}

async function onFileChange(event: string, filePath: string): Promise<void> {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    const { checkEslint } = await import('./checks/eslint');
    await runCheck('eslint:incremental', () => checkEslint(process.cwd()), [
      () => runEslintFix(process.cwd()),
    ]);
  }
}

export async function startDaemon(): Promise<void> {
  if (isRunning) {
    log.warn('Daemon already running');
    return;
  }

  startTime = Date.now();
  isRunning = true;
  log.info('AetherGuard daemon starting');

  // Run initial full check
  await fullCheck();
  await slowCheck();

  // Schedule recurring checks
  scheduleCheck(FAST_INTERVAL_MS, fullCheck);
  scheduleCheck(MEDIUM_INTERVAL_MS, slowCheck);
  scheduleCheck(SLOW_INTERVAL_MS, slowCheck);
  scheduleCheck(DAILY_INTERVAL_MS, dailyCheck);

  // File watcher for incremental checks
  await setupFileWatcher(process.cwd(), onFileChange);

  log.info('AetherGuard daemon started');
}

export async function stopDaemon(): Promise<void> {
  isRunning = false;
  for (const timer of timers) clearInterval(timer);
  timers.length = 0;
  closeFileWatcher();
  log.info('AetherGuard daemon stopped');
}

export function isDaemonRunning(): boolean {
  return isRunning;
}
