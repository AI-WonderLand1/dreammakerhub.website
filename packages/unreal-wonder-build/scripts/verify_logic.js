#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const blueprintPath = path.join(root, 'src', 'puckAiBlueprint.ts');

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(pkgPath)) fail('Missing package.json');
if (!fs.existsSync(blueprintPath)) fail('Missing src/puckAiBlueprint.ts');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const src = fs.readFileSync(blueprintPath, 'utf8');

const required = ['@puckeditor/plugin-ai', '@puckeditor/cloud-client', 'zod'];
for (const dep of required) {
  if (!pkg.puckIntegration?.requiredPackages?.includes(dep)) {
    fail(`package.json puckIntegration.requiredPackages missing ${dep}`);
  }
}

const requiredSnippets = [
  'zod/v4',
  'z.toJSONSchema',
  'puckHandler',
  'tool({',
  'bind: "getImageUrl"',
  'z.enum(["dogs", "cats"])',
  'fetch("https://example.com/api/random-image")',
];

for (const token of requiredSnippets) {
  if (!src.includes(token)) {
    fail(`puckAiBlueprint.ts missing snippet token: ${token}`);
  }
}

console.log('✅ verify_logic.js passed');
