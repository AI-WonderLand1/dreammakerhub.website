import 'server-only';
import { logger } from '@infra/lib/logger';
import { startDaemon, stopDaemon, getStats, isDaemonRunning } from '@core/aetherguard/daemon';

let started = false;

export async function startAetherGuardWorker(): Promise<void> {
  if (started) return;
  started = true;

  logger.info('AetherGuardWorker: starting...');
  try {
    await startDaemon();
    const stats = getStats();
    logger.info(`AetherGuardWorker: daemon running (uptime: ${stats.uptime}ms)`);
  } catch (e) {
    logger.error('AetherGuardWorker: failed to start', e instanceof Error ? { error: e.message } : undefined);
    started = false;
  }
}

export async function stopAetherGuardWorker(): Promise<void> {
  if (!started) return;
  await stopDaemon();
  started = false;
  logger.info('AetherGuardWorker: stopped');
}

export function getAetherGuardStatus() {
  return {
    initialized: started,
    running: isDaemonRunning(),
    stats: getStats(),
  };
}
