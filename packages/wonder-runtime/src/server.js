import Fastify from 'fastify';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, flatten, join, weld, textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join as pathJoin, dirname } from 'path';

const PROJECT_ID = process.env.PROJECT_ID || 'default';
const SSH_KEY_PATH = process.env.SSH_KEY_PATH || '/run/secrets/wonder-ssh/id_ed25519';
const WEBGLSTUDIO_PATH = process.env.EDITOR_PATH || '/app/public/webglstudio';
const PLAYCANVAS_PATH = process.env.PLAYCANVAS_PATH || '/app/public/playcanvas';
const USER_FILES_PATH = process.env.USER_FILES_PATH || '/app/user-project';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_CLEANUP_MS = 5 * 60 * 1000;
const rateLimitStore = new Map();

function getClientIp(request) {
  return request.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         request.headers['x-real-ip'] || 
         request.socket?.remoteAddress || 
         'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now - record.resetTime > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, resetTime: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  record.count++;
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupRateLimitStore, RATE_LIMIT_CLEANUP_MS);

const f = Fastify({ logger: true });

f.addHook('onRequest', async (request, reply) => {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return reply.status(429).send({ error: 'Rate limit exceeded' });
  }
});

const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);

function getSSHKey() {
  if (existsSync(SSH_KEY_PATH)) {
    return readFileSync(SSH_KEY_PATH, 'utf-8');
  }
  return null;
}

function loadUserFiles() {
  if (!existsSync(USER_FILES_PATH)) {
    return null;
  }
  const files = {};
  try {
    const entries = readdirSync(USER_FILES_PATH, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const content = readFileSync(pathJoin(USER_FILES_PATH, entry.name), 'utf-8');
        files[entry.name] = JSON.parse(content);
      }
    }
  } catch {
    f.log.warn('Failed to load user files');
  }
  return files;
}

const CONTENT_TYPES = {
  'js': 'application/javascript',
  'mjs': 'application/javascript',
  'css': 'text/css',
  'html': 'text/html',
  'json': 'application/json',
  'txt': 'text/plain',
  'glsl': 'x-shader/x-glsl',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'svg': 'image/svg+xml',
  'woff': 'font/woff',
  'woff2': 'font/woff2',
  'ttf': 'font/ttf',
};

f.get('/health', async (request, reply) => {
  const sshKey = getSSHKey();
  return {
    status: 'ok',
    project: PROJECT_ID,
    hasSSHKey: !!sshKey,
    features: ['webglstudio', 'playcanvas', 'gltf-optimization']
  };
});

function isPathSafe(basePath, requestedPath) {
  const resolvedPath = pathJoin(basePath, requestedPath);
  const normalizedBase = pathJoin(basePath);
  return resolvedPath.startsWith(normalizedBase) && !requestedPath.includes('..');
}

f.get('/editor/*', {
  config: {
    rateLimit: {
      max: 100,
      timeWindow: '1 minute',
    },
  },
}, async (request, reply) => {
  const filePath = request.url.replace('/editor/', '').split('?')[0];
  
  if (!isPathSafe(WEBGLSTUDIO_PATH, filePath)) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  
  const fullPath = pathJoin(WEBGLSTUDIO_PATH, filePath);
  
  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
    return reply.status(404).send({ error: 'Not found', path: filePath });
  }
  
  const ext = filePath.split('.').pop();
  const contentType = CONTENT_TYPES[ext] || 'text/plain';
  
  return reply
    .status(200)
    .header('Content-Type', contentType)
    .send(readFileSync(fullPath));
});

f.get('/playcanvas/*', {
  config: {
    rateLimit: {
      max: 100,
      timeWindow: '1 minute',
    },
  },
}, async (request, reply) => {
  const filePath = request.url.replace('/playcanvas/', '').split('?')[0];
  
  if (!isPathSafe(PLAYCANVAS_PATH, filePath)) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  
  const fullPath = pathJoin(PLAYCANVAS_PATH, filePath);
  
  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
    return reply.status(404).send({ error: 'Not found', path: filePath });
  }
  
  const ext = filePath.split('.').pop();
  const contentType = CONTENT_TYPES[ext] || 'application/javascript';
  
  return reply
    .status(200)
    .header('Content-Type', contentType)
    .send(readFileSync(fullPath));
});

f.post('/optimize', {
  config: {
    rateLimit: { max: 10, timeWindow: '1 minute' },
  },
}, async (request, reply) => {
  try {
    const buffer = await request.body;
    if (!buffer || buffer.length === 0) {
      return reply.status(400).send({ error: 'No glTF data provided' });
    }
    
    const document = await io.readBinary(new Uint8Array(buffer));
    await document.transform(
      dedup(),
      flatten(),
      join(),
      weld(),
      textureCompress({
        encoder: sharp,
        targetFormat: 'webp',
        resize: [2048, 2048],
      }),
    );
    
    const optimized = await io.writeBinary(document);
    return reply
      .status(200)
      .header('Content-Type', 'model/gltf-binary')
      .send(Buffer.from(optimized));
  } catch (err) {
    f.log.error(err);
    return reply.status(500).send({ error: 'Optimization failed', detail: err.message });
  }
});

f.post('/files/save', {
  config: {
    rateLimit: { max: 30, timeWindow: '1 minute' },
  },
}, async (request, reply) => {
  try {
    const { filename, content } = request.body || {};
    if (!filename || !content) {
      return reply.status(400).send({ error: 'Missing filename or content' });
    }
    
    // Validate filename to prevent path traversal
    if (typeof filename !== 'string' || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return reply.status(400).send({ error: 'Invalid filename' });
    }
    
    const filePath = pathJoin(USER_FILES_PATH, filename);
    const dir = dirname(filePath);
    
    // Ensure the resolved path is within USER_FILES_PATH
    if (!filePath.startsWith(USER_FILES_PATH) || !dir.startsWith(USER_FILES_PATH)) {
      return reply.status(403).send({ error: 'Access denied' });
    }
    
    if (!existsSync(dir)) {
      writeFileSync(dir, '');
    }
    
    writeFileSync(filePath, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    
    return { success: true, filename };
  } catch (err) {
    f.log.error(err);
    return reply.status(500).send({ error: 'Failed to save file' });
  }
});

f.get('/files', {
  config: {
    rateLimit: { max: 60, timeWindow: '1 minute' },
  },
}, async (request, reply) => {
  return { files: loadUserFiles() || {} };
});

f.get('/files/*', {
  config: {
    rateLimit: { max: 60, timeWindow: '1 minute' },
  },
}, async (request, reply) => {
  const fileName = request.url.replace('/files/', '').split('?')[0];
  
  // SECURITY: Validate path safety to prevent path traversal
  if (!isPathSafe(USER_FILES_PATH, fileName)) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  
  const fullPath = pathJoin(USER_FILES_PATH, fileName);
  
  if (!existsSync(fullPath)) {
    return reply.status(404).send({ error: 'File not found' });
  }
  
  const ext = fileName.split('.').pop();
  const contentType = CONTENT_TYPES[ext] || 'application/json';
  
  return reply
    .status(200)
    .header('Content-Type', contentType)
    .send(readFileSync(fullPath));
});

f.get('/project/files', {
  config: {
    rateLimit: { max: 60, timeWindow: '1 minute' },
  },
}, async (request, reply) => {
  return { projectId: PROJECT_ID, files: loadUserFiles() || {} };
});

async function start() {
  await f.listen({ port: 3090, host: '0.0.0.0' });
  f.log.info(`Wonder Runtime started for project ${PROJECT_ID}`);
  f.log.info(`Features: WebGL Studio + PlayCanvas + glTF Optimizer`);
  f.log.info(`SSH key loaded: ${!!getSSHKey()}`);
}

start();