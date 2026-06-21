import fs from 'fs';
import { execSync } from 'child_process';

const KEY = process.env.ANTHROPIC_API_KEY;
const findings = JSON.parse(fs.readFileSync('findings.json', 'utf8'));
if (!findings.length) { console.log('No open findings.'); process.exit(0); }

const finding = findings[0];
const file = finding.most_recent_instance.location.path;
const code = fs.readFileSync(file, 'utf8');

async function ask(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
  });
  const data = await res.json();
  const text = data.content[0].text;
  const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
  return JSON.parse(match[1] || match[0]);
}

// 1. Generate PoC test
const poc = await ask(`CodeQL flagged ${finding.rule.id} (${finding.rule.description}) in ${file} line ${finding.most_recent_instance.location.start_line}.
File content:\n${code}\n
Write one test reproducing this vuln that FAILS on current code. Match repo's existing test style.
Respond ONLY JSON: {"test_file_path": "...", "test_file_content": "..."}`);
fs.writeFileSync(poc.test_file_path, poc.test_file_content);

// 2. Confirm it fails
let failed = false;
try { execSync(`npm test -- ${poc.test_file_path}`, { stdio: 'inherit' }); }
catch { failed = true; }
if (!failed) { console.error('PoC did not fail — false positive or bad PoC. Aborting.'); process.exit(1); }

// 3. Generate patch
const patch = await ask(`Vulnerable file:\n${code}\nFailing PoC test:\n${poc.test_file_content}\n
Write a minimal fix for ${file} (${finding.rule.id}) without changing unrelated behavior.
Respond ONLY JSON: {"file_path": "${file}", "fixed_content": "..."}`);
fs.writeFileSync(patch.file_path, patch.fixed_content);

// 4. Confirm PoC now passes
try { execSync(`npm test -- ${poc.test_file_path}`, { stdio: 'inherit' }); }
catch { console.error('Fix did not resolve vuln. Aborting.'); process.exit(1); }

// 5. Confirm full suite passes
try { execSync('npm test', { stdio: 'inherit' }); }
catch { console.error('Fix broke other tests. Aborting.'); process.exit(1); }

console.log('PROOF_COMPLETE');
