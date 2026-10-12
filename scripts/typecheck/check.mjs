import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
const root = resolve(process.env.TYPECHECK_ROOT || '.');
const configPath = resolve(root, 'apps/web/tsconfig.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, resolve(root, 'apps/web'));
const program = ts.createProgram(parsed.fileNames, { ...parsed.options, incremental: false, noEmit: true });
const counts = {};
for (const diagnostic of [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]) {
  const file = diagnostic.file ? relative(root, diagnostic.file.fileName).replaceAll('\\', '/') : '<config>';
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n').replaceAll(root, '<repo>').replaceAll(resolve('.'), '<repo>');
  const key = `${file}: TS${diagnostic.code}: ${message}`;
  counts[key] = (counts[key] || 0) + 1;
}
const baselinePath = resolve('scripts/typecheck/known-diagnostics.json');
if (process.argv.includes('--capture-baseline')) {
  writeFileSync(baselinePath, JSON.stringify(Object.fromEntries(Object.entries(counts).sort()), null, 2) + '\n');
  console.log(`Captured ${Object.values(counts).reduce((a,b) => a+b,0)} existing diagnostics. This is not a clean typecheck.`);
  process.exit(0);
}
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const newDiagnostics = Object.entries(counts).filter(([key, count]) => count > (baseline[key] || 0));
for (const [key, count] of newDiagnostics) console.error(`${key} (${count} occurrence(s))`);
const remaining = Object.values(counts).reduce((a,b) => a+b,0);
console.log(`TypeScript regression check: ${remaining} existing diagnostics; ${newDiagnostics.length} new/increased diagnostics. Full enforcement still requires clearing the recorded backlog.`);
if (newDiagnostics.length) process.exitCode = 1;
