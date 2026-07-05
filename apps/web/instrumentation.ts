export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { startAetherGuardWorker } = await import('../../runners/aetherguardWorker');
      await startAetherGuardWorker();
    } catch {
      // daemon start failure is non-fatal for the app
    }
  }
}
