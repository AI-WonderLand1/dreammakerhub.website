import net from 'node:net';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
<<<<<<< HEAD
import { selectDevPort } from './dev-port.mjs';

=======
import { readFileSync } from 'node:fs';
import { selectDevPort } from './dev-port.mjs';

// Load .env file explicitly (Next.js 16 has a known issue with .env auto-loading in monorepos)
const envPath = path.resolve(import.meta.dirname, '..', '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch (err) {
  console.warn(`[run-dev] Could not load .env from ${envPath}:`, err.message);
}

>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
const require = createRequire(import.meta.url);

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
   
  console.log(`[ai-wonder-web] Port 9002 is in use, starting on available port ${port}.`);
}

const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'dev', '--webpack', '-p', String(port), '-H', '0.0.0.0'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_DISABLE_TURBOPACK: '1',
    NEXT_TURBOPACK: '0',
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
