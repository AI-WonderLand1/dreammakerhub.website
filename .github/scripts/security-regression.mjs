import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const ci = read('.github/workflows/ci.yml');
const agent = read('apps/web/app/api/agent/route.ts');
const entitlement = read('apps/web/app/api/checkout/entitle/route.ts');
const stripe = read('apps/web/app/api/webhooks/stripe/route.ts');

// PRs execute contributor-controlled code. Never expose real Actions secrets to npm install/build/tests.
check(!/\$\{\{\s*secrets\./.test(ci), 'CI must not expose production secrets to PR code');
check(/pull_request:/.test(ci), 'CI must run for pull requests');
check(/requireUserId\(req\)/.test(agent) && agent.indexOf('requireUserId(req)') < agent.indexOf('runModel({'), 'Agent route must authenticate before calling a paid model');
check(/status:\s*401/.test(agent), 'Agent route must reject unauthenticated users');
check(/status:\s*410/.test(entitlement), 'Manual entitlement endpoint must stay disabled');
check(/stripe\.webhooks\.constructEvent\(/.test(stripe), 'Stripe events must be signature-verified');
// Accept either a positive signature check with an error branch or an explicit
// negative guard that returns 400 before constructing the event. This remains a
// targeted static assertion, not a substitute for signed webhook integration tests.
const positiveSignatureGuard = /STRIPE_WEBHOOK_SECRET\s*&&\s*signature/.test(stripe);
const negativeSignatureGuard = /if\s*\(\s*!STRIPE_WEBHOOK_SECRET\s*\|\|\s*!signature\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\([^;]*status:\s*400/.test(stripe);
check(positiveSignatureGuard || negativeSignatureGuard, 'Missing Stripe webhook secret or signature must fail closed');

if (failures.length) {
  failures.forEach((failure) => console.error(`::error::${failure}`));
  process.exitCode = 1;
} else {
  console.log('Security regression checks passed (targeted static assertions, not a complete security audit).');
}
