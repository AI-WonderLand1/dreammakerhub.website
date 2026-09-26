// Public, credential-free launch diagnostic. This is NOT a customer workflow test.
import { lookup } from 'node:dns/promises';
import { appendFile } from 'node:fs/promises';

export const targets = Object.freeze([
  { name: 'Main homepage', url: 'https://dreammakerhub.website/', type: 'html' },
  { name: 'Main health', url: 'https://dreammakerhub.website/api/health', type: 'json' },
  { name: 'Playground homepage', url: 'https://playground.dreammakerhub.website/', type: 'html' },
  { name: 'Playground health', url: 'https://playground.dreammakerhub.website/api/health', type: 'json' },
  { name: 'WonderPlay homepage', url: 'https://wonderplay-3d.dreammakerhub.website/', type: 'html' },
  { name: 'Coder public build information', url: 'https://coder.dreammakerhub.website/api/v2/buildinfo', type: 'json' },
]);

export async function inspectEndpoints({ list = targets, request = fetch, resolve = lookup } = {}) {
  const results = [];
  for (const target of list) {
    const parsed = new URL(target.url);
    if (parsed.protocol !== 'https:' || !['html', 'json'].includes(target.type)) {
      throw new Error('Only predefined HTTPS public HTML/JSON diagnostics are allowed');
    }
    let dns = 'unresolved';
    let http = 'not checked';
    let result = 'FAIL';
    try {
      await resolve(parsed.hostname);
      dns = 'resolved';
      const response = await request(parsed, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(12000),
        headers: { Accept: target.type === 'json' ? 'application/json' : 'text/html' },
      });
      http = String(response.status);
      const mime = (response.headers.get('content-type') || '').toLowerCase();
      if (response.status === 200 && mime.includes(target.type === 'json' ? 'json' : 'html')) {
        if (target.type === 'json') await response.json();
        result = 'PASS';
      }
    } catch {
      // Never print response bodies, credentials, cookies, host stack traces or provider errors.
    }
    results.push({ name: target.name, url: target.url, dns, http, result });
  }
  return results;
}

export function renderSummary(results) {
  const lines = [
    '## Read-only public launch endpoints',
    '',
    'Checks only DNS resolution, HTTP 200 and response type. They do not prove login, billing, AI, publishing, pod isolation, or TLS coverage for wildcard Coder apps.',
    '',
    '| Endpoint | DNS | HTTP | Result |',
    '|---|---|---|---|',
    ...results.map(({ name, dns, http, result }) => `| ${name} | ${dns} | ${http} | ${result} |`),
    '',
    '**FAIL means investigation required.** No public endpoint, production data or deployment was changed.',
  ];
  return lines.join('\n') + '\n';
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const results = await inspectEndpoints();
  const summary = renderSummary(results);
  process.stdout.write(summary);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  if (results.some((row) => row.result !== 'PASS')) process.exitCode = 1;
}
