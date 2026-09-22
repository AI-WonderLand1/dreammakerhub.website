// Read-only production checks: no credentials, no writes, no private endpoints.
const main = process.env.MAIN_SITE_URL || 'https://dreammakerhub.website';
const playground = process.env.PLAYGROUND_URL || 'https://playground.dreammakerhub.website';
const npc = process.env.NPC_PUBLIC_URL || '';
const expectedSha = process.env.EXPECTED_DEPLOY_SHA || '';
const checks = [
  [main, '/', 'html'],
  [main, '/api/health', 'json'],
  [main, '/api/config/supabase', 'json'],
  [playground, '/', 'html'],
  [playground, '/api/health', 'json'],
];
if (npc) checks.push([npc, '/api/health', 'json']);
let failures = 0;
for (const [origin, path, kind] of checks) {
  try {
    const url = new URL(path, origin);
    if (url.protocol !== 'https:') throw new Error('Expected HTTPS');
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'manual', headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes(kind === 'json' ? 'json' : 'html')) throw new Error(`Unexpected content type (${contentType.split(';')[0]})`);
    if (kind === 'json') await response.json();
    else if (url.origin === new URL(playground).origin && !(await response.text()).includes('id="root"')) throw new Error('Playground SPA root missing');
    console.log(`PASS ${url.origin}${path}`);
  } catch (error) {
    failures++;
    console.error(`::error::FAIL ${origin}${path}: ${error.message}`);
  }
}
try {
  const response = await fetch(new URL('/api/build-info', main), { signal: AbortSignal.timeout(15000), headers: { 'Cache-Control': 'no-cache' } });
  const info = response.ok ? await response.json() : {};
  const actualSha = typeof info.buildSha === 'string' ? info.buildSha : '';
  if (expectedSha && actualSha !== expectedSha) {
    failures++;
    console.error(`::error::Live web image SHA does not match this deployment. Expected ${expectedSha}; got ${/^[0-9a-f]{40}$/.test(actualSha) ? actualSha : 'unknown'}.`);
  } else if (/^[0-9a-f]{40}$/.test(actualSha)) {
    console.log(`Deployed SHA verified: ${actualSha}`);
  } else {
    console.warn('::warning::Deployment SHA cannot be verified: /api/build-info returned unknown.');
  }
} catch (error) {
  if (expectedSha) { failures++; console.error('::error::Deployment SHA endpoint could not be checked.'); }
  else console.warn('::warning::Deployment SHA endpoint could not be checked.');
}
if (!npc) console.warn('::warning::NPC_PUBLIC_URL not configured; NPC public URL was not checked.');
if (failures) process.exitCode = 1;
