#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

async function readJson(file) {
  const raw = await readFile(file, 'utf8');
  return JSON.parse(raw);
}

async function runWorker(worker, schema) {
  const startedAt = new Date().toISOString();
  const stateKeys = Object.keys(schema.state ?? {});

  return {
    workerId: worker.id,
    name: worker.name,
    startedAt,
    finishedAt: new Date().toISOString(),
    loadedSchemaVersion: schema.version,
    stateTopLevelKeys: stateKeys,
    scope: worker.scope,
    deliverables: worker.deliverables,
    status: 'ready'
  };
}

async function main() {
  const schema = await readJson('docs/blueprints/master-schema.json');
  const taskSpec = await readJson('docs/blueprints/worker-tasks.json');

  const results = await Promise.all(taskSpec.workers.map((worker) => runWorker(worker, schema)));

  const output = {
    protocol: taskSpec.protocol,
    workers: results,
    mergeGate: {
      stateShapeLocked: taskSpec.protocol.stateShapeLocked,
      overlapForbidden: taskSpec.protocol.overlapForbidden,
      readyToImplement: results.every((worker) => worker.status === 'ready')
    }
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error('[swarm] failed:', error.message);
  process.exitCode = 1;
});
