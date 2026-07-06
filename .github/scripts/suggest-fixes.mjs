import { execSync } from 'child_process';
import fs from 'fs';

const KEY = process.env.ANTHROPIC_API_KEY;
const risk = JSON.parse(fs.readFileSync('risk-report.json', 'utf8'));
const changed = execSync('git diff --name-only origin/Master...HEAD', { encoding: 'utf8' })
  .split('\n').filter(Boolean);

const hits = risk.filter(r => changed.includes(r.file));
if (!hits.length) { console.log('No risky files in this PR.'); process.exit(0); }

async function ask(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
  });
  return (await res.json()).content[0].text;
}

let comment = '## ⚠️ Risk-Predicted Files in This PR\n\n';

for (const hit of hits) {
  const content = fs.readFileSync(hit.file, 'utf8').slice(0, 6000);
  const bugLog = execSync(`git log --since="90 days ago" --pretty=format:"%s" -- "${hit.file}"`, { encoding: 'utf8' })
    .split('\n').filter(l => /^(fix|bug|hotfix|patch)/i.test(l));

  const suggestion = await ask(`File: ${hit.file}
${hit.bugFixes} bug-fix commits here in 90 days. Past fix messages:
${bugLog.join('\n')}

Current content:
---
${content}
---
Give 3-4 specific, concrete suggestions to reduce future bugs in THIS file (missing tests, error handling gaps, refactor targets). No generic advice.`);

  comment += `### \`${hit.file}\` (risk ${hit.riskScore.toFixed(1)}, ${hit.bugFixes} past fixes)\n${suggestion}\n\n`;
}

fs.writeFileSync('risk-comment.md', comment);
