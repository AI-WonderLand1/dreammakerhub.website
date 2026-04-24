import Fastify from 'fastify';
import { Document, NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { draco, textureCompress, dedup, flatten, join, weld } from '@gltf-transform/functions';
import sharp from 'sharp';
import { readFileSync, existsSync, statSync } from 'fs';
import { join as pathJoin } from 'path';

const PROJECT_ID = process.env.PROJECT_ID || 'default';
const SSH_KEY_PATH = process.env.SSH_KEY_PATH || '/run/secrets/wonder-ssh/id_ed25519';
const EDITOR_PATH = process.env.EDITOR_PATH || '/app/public/webglstudio';
const USER_FILES_PATH = process.env.USER_FILES_PATH || '/app/user-project';

const f = Fastify({ logger: true });

const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);

function getSSHKey(): string | null {
  if (existsSync(SSH_KEY_PATH)) {
    return readFileSync(SSH_KEY_PATH, 'utf-8');
  }
  return null;
}

function loadUserFiles(): any {
  const userDir = USER_FILES_PATH;
  if (!existsSync(userDir)) {
    return null;
  }
  const files: Record<string, any> = {};
  try {
    const entries = readdirSync(userDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const content = readFileSync(pathJoin(userDir, entry.name), 'utf-8');
        files[entry.name] = JSON.parse(content);
      }
    }
  } catch {}
  return files;
}

f.get('/health', async () => {
  const sshKey = getSSHKey();
  const userFiles = loadUserFiles();
  
  return { 
    status: 'ok', 
    project: PROJECT_ID,
    hasSSHKey: !!sshKey,
    hasUserFiles: !!userFiles,
    sshKeyPreview: sshKey ? sshKey.slice(0, 50) + '...' : null,
    files: Object.keys(userFiles || {})
  };
});

f.post('/optimize', async (request, reply) => {
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
      draco(),
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

f.get('/editor/*', async (request, reply) => {
  const filePath = request.url.replace('/editor/', '');
  const fullPath = pathJoin(EDITOR_PATH, filePath);
  
  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
    return reply.status(404).send({ error: 'Not found', path: filePath });
  }
  
  const content = readFileSync(fullPath);
  const ext = filePath.split('.').pop();
  const contentTypes: Record<string, string> = {
    'js': 'application/javascript',
    'mjs': 'application/javascript',
    'css': 'text/css',
    'html': 'text/html',
    'json': 'application/json',
    'txt': 'text/plain'
  };
  
  return reply
    .status(200)
    .header('Content-Type', contentTypes[ext || 'txt'] || 'text/plain')
    .send(content);
});

f.get('/playcanvas/*', async (request, reply) => {
  const filePath = request.url.replace('/playcanvas/', '');
  const basePath = process.env.PLAYCANVAS_PATH || '/app/public/playcanvas';
  const fullPath = pathJoin(basePath, filePath);
  
  if (!existsSync(fullPath)) {
    return reply.status(404).send({ error: 'Not found' });
  }
  
  const content = readFileSync(fullPath);
  return reply
    .status(200)
    .header('Content-Type', 'application/javascript')
    .send(content);
});

f.get('/project/files', async () => {
  const userFiles = loadUserFiles();
  return { projectId: PROJECT_ID, files: userFiles || {} };
});

f.get('/project/*', async (request, reply) => {
  const pathParts = request.url.replace('/project/', '').split('/');
  const fileName = pathParts[pathParts.length - 1];
  const fullPath = pathJoin(USER_FILES_PATH, fileName);
  
  if (!existsSync(fullPath)) {
    return reply.status(404).send({ error: 'File not found' });
  }
  
  return reply.send(readFileSync(fullPath));
});

async function start() {
  await f.listen({ port: 3090, host: '0.0.0.0' });
  f.log.info(`Wonder Runtime started for project ${PROJECT_ID}`);
  f.log.info(`SSH key loaded: ${!!getSSHKey()}`);
}

start();