import net from 'node:net';
import { spawn } from 'node:child_process';
import { selectDevPort } from './dev-port.mjs';

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '0.0.0.0');
  });
}

const { port, source } = await selectDevPort({
  envPort: process.env.PORT,
  isPortAvailable,
});

if (source === 'auto-fallback') {
  // eslint-disable-next-line no-console
  console.log(`[ai-wonder-web] Port 9002 is in use, starting on available port ${port}.`);
}

const nextBin = process.platform === 'win32' ? 'next.cmd' : 'next';
const child = spawn(nextBin, ['dev', '-p', String(port), '-H', '0.0.0.0'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_DISABLE_TURBOPACK: '1',
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
