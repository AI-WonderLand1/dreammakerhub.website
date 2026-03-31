export const DEFAULT_WEB_DEV_PORT = 5000;

export function parsePort(rawPort) {
  if (rawPort === undefined || rawPort === null || rawPort === '') {
    return null;
  }

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return port;
}

export async function findAvailablePort({
  preferredPort,
  maxPort = preferredPort + 20,
  isPortAvailable,
}) {
  if (!isPortAvailable) {
    throw new Error('isPortAvailable is required');
  }

  for (let port = preferredPort; port <= maxPort; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port found in range ${preferredPort}-${maxPort}`);
}

export async function selectDevPort({ envPort, isPortAvailable }) {
  const parsedEnvPort = parsePort(envPort);

  if (parsedEnvPort !== null) {
    return {
      port: parsedEnvPort,
      source: 'env',
    };
  }

  const port = await findAvailablePort({
    preferredPort: DEFAULT_WEB_DEV_PORT,
    isPortAvailable,
  });

  return {
    port,
    source: port === DEFAULT_WEB_DEV_PORT ? 'default' : 'auto-fallback',
  };
}
