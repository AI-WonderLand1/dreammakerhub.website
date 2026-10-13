#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { inspect, proposeCorrections, review } from '../src/core.mjs';
import { startServer } from '../src/server.mjs';

const args = process.argv.slice(2);
const command = args.shift();
const option = (name, fallback = undefined) => {
  const i = args.indexOf('--' + name);
  return i < 0 ? fallback : args[i + 1];
};
const load = async (p) => JSON.parse(await readFile(p, 'utf8'));
const save = async (value) => {
  const data = JSON.stringify(value, null, 2) + '\n';
  if (option('out')) await writeFile(option('out'),data,{flag:'wx'});
  else process.stdout.write(data);
};
const scan = async (file) => inspect(await load(file), {
  verifierSecret: process.env.TRUTHSHIELD_VERIFIER_SECRET,
  auditSecret: process.env.TRUTHSHIELD_AUDIT_SECRET,
  allowedAgents: process.env.TRUTHSHIELD_ALLOWED_AGENTS?.split(',').filter(Boolean),
});
try {
  if (command === 'scan' && args[0]) {
    const result = await scan(args[0]);
    await save(result);
    process.exitCode = result.decision === 'blocked' ? 3 : result.decision === 'needs_human_review' ? 2 : 0;
  } else if (command === 'propose' && args[0]) {
    const input = await load(args[0]);
    const report = await inspect(input, { verifierSecret: process.env.TRUTHSHIELD_VERIFIER_SECRET,
      auditSecret: process.env.TRUTHSHIELD_AUDIT_SECRET });
    await save(proposeCorrections(input, report));
    process.exitCode = report.decision === 'blocked' ? 3 : report.decision === 'needs_human_review' ? 2 : 0;
  } else if (command === 'review' && args[0]) {
    await save(review(await load(args[0]), {
      reviewer: option('reviewer'),
      action: option('action'),
      reason: option('reason'),
      correctionInput: option('correction'),
    }));
  } else if (command === 'serve') {
    const port = Number(option('port', process.env.PORT || '8742'));
    if (!Number.isInteger(port) || port <= 0 || port > 65535) throw Error('Invalid port');
    await startServer({ port });
  } else {
    process.stderr.write('Usage:\n  truthshield scan <input.json> [--out result.json]\n' +
      '  truthshield propose <input.json> [--out proposed.json]\n' +
      '  truthshield review <report.json> --reviewer NAME --action approve|reject|request_changes --reason TEXT\n' +
      '  truthshield serve [--port 8742]\nExit codes: 0 clear, 2 human review, 3 blocked, 1 command error\n');
    process.exitCode = 1;
  }
} catch (err) {
  process.stderr.write('TruthShield: ' + (err instanceof Error ? err.message : 'Unexpected failure') + '\n');
  process.exitCode = 1;
}
