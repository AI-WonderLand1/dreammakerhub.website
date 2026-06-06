import { startAetherGuardWorker } from '../../runners/aetherguardWorker';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      await startAetherGuardWorker();
    } catch {
      // daemon start failure is non-fatal for the app
    }
  }
}
