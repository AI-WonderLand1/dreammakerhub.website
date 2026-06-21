import { execSync } from 'child_process';
import fs from 'fs';

const DAYS = 90;
const log = execSync(
  `git log --since="${DAYS} days ago" --name-only --pretty=format:"COMMIT|%H|%s"`,
  { encoding: 'utf8' }
);

const fileStats = {};
let isBugFix = false;

for (const line of log.split('\n')) {
  if (line.startsWith('COMMIT|')) {
    const msg = line.split('|')[2] || '';
    isBugFix = /^(fix|bug|hotfix|patch)[:(]/i.test(msg) || /fix(ed)?\s/i.test(msg);
  } else if (line.trim()) {
    const file = line.trim();
    fileStats[file] ||= { churn: 0, bugFixes: 0 };
    fileStats[file].churn++;
    if (isBugFix) fileStats[file].bugFixes++;
  }
}

const scored = Object.entries(fileStats)
  .map(([file, s]) => ({
    file, churn: s.churn, bugFixes: s.bugFixes,
    riskScore: s.bugFixes * 3 + s.churn * 0.5
  }))
  .sort((a, b) => b.riskScore - a.riskScore)
  .slice(0, 15);

fs.writeFileSync('risk-report.json', JSON.stringify(scored, null, 2));
scored.forEach(f =>
  console.log(`${f.riskScore.toFixed(1)}  ${f.file}  (${f.bugFixes} bug-fixes, ${f.churn} changes)`)
);
