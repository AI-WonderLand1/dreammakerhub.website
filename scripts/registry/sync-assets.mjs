#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dryRun = process.argv.includes('--dry-run');

function normalizeTarget(asset) {
  if (asset.targetDirectory) return asset.targetDirectory;
  if (asset.kind === 'code-package') {
    return asset.source === 'local' && asset.path ? asset.path : path.posix.join('packages', asset.id);
  }
  return path.posix.join('Content', 'Marketplace', asset.id);
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readRegistry() {
  const registryPath = path.join(root, 'registry.json');
  const raw = await fs.readFile(registryPath, 'utf8');
  const doc = JSON.parse(raw);

  if (!doc || doc.schemaVersion !== 1 || !Array.isArray(doc.assets)) {
    throw new Error('Invalid registry.json: expected { schemaVersion: 1, assets: [] }');
  }

  return doc;
}

async function sync() {
  const doc = await readRegistry();
  const results = [];

  for (const asset of doc.assets) {
    const targetDirectory = normalizeTarget(asset);
    const targetPath = path.join(root, targetDirectory);

    let status = 'ready';
    let action = 'verify-local';
    let detail = 'Target already present';

    if (asset.source === 'local') {
      const localPath = path.join(root, asset.path ?? targetDirectory);
      const ok = await exists(localPath);
      status = ok ? 'ready' : 'missing';
      detail = ok ? `Local source verified: ${asset.path ?? targetDirectory}` : `Missing local source: ${asset.path ?? targetDirectory}`;
    } else if (asset.source === 'github') {
      action = 'clone-github';
      const ok = await exists(targetPath);
      status = ok ? 'ready' : dryRun ? 'missing' : 'ready';
      detail = ok
        ? 'GitHub target already present'
        : dryRun
        ? 'Missing target (dry-run): clone required'
        : 'Created placeholder target directory for GitHub sync';
      if (!ok && !dryRun) {
        await fs.mkdir(targetPath, { recursive: true });
      }
    } else if (asset.source === 'fab') {
      action = 'map-fab-vault';
      const vaultPath = asset.vaultPath ? path.join(root, asset.vaultPath) : null;
      const ok = vaultPath ? await exists(vaultPath) : false;
      status = ok ? 'ready' : 'missing';
      detail = ok ? `Fab vault mapped: ${asset.vaultPath}` : 'Fab vault path unavailable; launcher/manual import required';
    }

    results.push({
      id: asset.id,
      source: asset.source,
      kind: asset.kind,
      action,
      targetDirectory,
      status,
      detail,
    });
  }

  const lock = {
    generatedAt: new Date().toISOString(),
    dryRun,
    assets: results,
  };

  if (!dryRun) {
    await fs.writeFile(path.join(root, 'registry.lock.json'), JSON.stringify(lock, null, 2), 'utf8');
  }

  const hasMissing = results.some((r) => r.status === 'missing');
  console.log(JSON.stringify(lock, null, 2));

  if (hasMissing) process.exitCode = 2;
}

sync().catch((error) => {
  console.error(`[registry-sync] ${error.message}`);
  process.exit(1);
});
