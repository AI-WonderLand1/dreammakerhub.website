# AI WONDERLAND TruthShield — Multi-Agent Verification Engine

**Status: functional developer preview, not production-ready or published for sale.**

TruthShield is an independent, model-agnostic verification gateway for Alice and any other AI agents. It is **not** a replacement for the AIs, and does **not** claim zero hallucinations. It validates the claims and artifacts agents return and prevents unverified actions from being automatically accepted.

Node 22+, standard library only; no package installation necessary to use the CLI. License remains **UNLICENSED** until AI WONDERLAND chooses its commercial license.

## Implemented now

- Shared scan contract for 1–16 independent agents, with tenant, run, stage, and artifact identity.
- Deterministic passes for malformed JSON, unsafe file paths, duplicate paths, suspected secrets, risky execution patterns, and unsupported success claims.
- Signed, run- and artifact-bound independent evidence for explicit build/test/deployment/fact/security claims; missing evidence triggers review; signed failing evidence triggers hard stop.
- Signed receipts across agent-to-agent handoffs, with chain linkage in the report.
- Three states: **CHECKS PASSED (not factual guarantee)**, **HUMAN REVIEW REQUIRED**, **HARD STOP**.
- Typed human responses: approve as *unverified*, reject, or request changes with correction instructions. A hard stop cannot be overridden.
- Authenticated HTTP endpoints with hashed API keys, tenant scoping, separate scan/reviewer privileges, request limits, and bound localhost development server.
- Source patch proposals, reviewer input, and mandatory rechecking of revised candidates **without applying to disk**.
- Trusted additional validators via the engine's optional validator interface; asynchronous validators run in parallel and failure or timeout blocks release.
- A four-agent demo pattern; none of your actual model credentials or production endpoints is required to run the tests.

## Quick start

From the root of the website repository:

    node --test packages/truthshield/tests/*.node-test.mjs

To run the built-in example (expected exit code **2** because there are unverified claims):

    node packages/truthshield/bin/truthshield.mjs scan packages/truthshield/examples/invalid-claim.json

CLI:

    truthshield scan <input.json> [--out report.json]
    truthshield propose <input.json> [--out proposal.json]
    truthshield review <report.json> --reviewer owner --action request_changes --reason "Run real build tests"
    truthshield serve [--port 8742]

Local CLI path is 'node packages/truthshield/bin/truthshield.mjs'. The package intentionally is not publicly published yet.

**Exit codes:** 0 means deterministic policy checks passed; 2 means human review; 3 means hard stop; 1 means invalid command or input. Exit code 0 is **not** proof that the app compiles or claims are true.

## Input contract

    {
      "tenantId": "demo",
      "agentId": "alice",
      "runId": "run-42",
      "stage": "draft",
      "candidate": {
        "text": "I propose this React page.",
        "files": [{"path": "app/page.tsx", "content": "export default function Page(){return <h1>Hello</h1>}"}]
      },
      "claims": [
        {"kind": "test", "statement": "Unit tests passed", "evidenceIds": ["test-42"]}
      ],
      "evidence": []
    }

Valid claim kinds: build, test, deployment, fact, security. A normal AI-generated "tests passed" sentence is NOT independent evidence.

### Verifier evidence

Evidence is signed by a **trusted isolated verifier**, never by the AI that wrote the output. The verifier uses the server-only 'TRUTHSHIELD_VERIFIER_SECRET' to call 'signEvidence(payload,secret)' from 'src/core.mjs'.

Required payload fields: 'id', 'tenantId', 'runId', 'artifactHash', 'kind', 'status' ('passed'/'failed'), 'issuer', 'timestamp' (ISO 8601). The signature binds the evidence to the exact artifact hash; records older than one hour are rejected.

The engine supports 'TRUTHSHIELD_AUDIT_SECRET' for signed inter-agent receipts. These secrets must never be included in prompts, browser code, ZIP exports, or tenant-visible settings.

A reviewer can explicitly continue an **unverified** case through 'POST /v1/reviews' only with a separate reviewer-scoped key. The receipt retains the 'human_approved_unverified' status. A failed signed test or detected secret is always a hard stop.

## Development API (localhost only)

Set your own random tokens and record only their SHA-256 hashes in 'TRUTHSHIELD_KEYS_JSON'. **Do not commit the hashes or plaintext tokens.**

Create a hash locally:

    node -e "const c=require('node:crypto');console.log(c.createHash('sha256').update(process.argv[1]).digest('hex'))" YOUR_PRIVATE_TOKEN

Example environment shape, using placeholder hashes **not valid secrets**:

    TRUTHSHIELD_KEYS_JSON='[{"id":"scanner","tenantId":"demo","sha256":"<64-character-real-hash>","scopes":["scan"]},{"id":"reviewer","tenantId":"demo","sha256":"<64-character-real-hash>","scopes":["review"]}]'
    TRUTHSHIELD_AGENTS_JSON='{"demo":["alice","frontend","security","confessions"]}'
    TRUTHSHIELD_VERIFIER_SECRET='<random-32-plus-chars>'
    TRUTHSHIELD_AUDIT_SECRET='<independent-random-32-plus-chars>'

Run:

    node packages/truthshield/bin/truthshield.mjs serve --port 8742

Endpoints: 'GET /health', 'POST /v1/scan' (scan key), 'POST /v1/reviews' (review key). Use 'Authorization: Bearer TOKEN'. The API enforces the tenant ID from the key, not the submitted payload. It runs on 127.0.0.1 and should not be exposed publicly as-is.

## Connecting all four AIs

Import 'runPipeline' from 'src/pipeline.mjs'. Supply each of your actual AIs as an adapter with an 'id' and an async 'generate(...)' function; the sample names are only roles. The same gate checks all four, including each handoff. Models can be local, Hugging Face, OpenRouter, Google, or your own inference server.

    const agents = [
      { id: "alice",       generate: aliceAdapter },
      { id: "frontend",    generate: frontendAdapter },
      { id: "security",    generate: securityAdapter },
      { id: "confessions", generate: confessionAdapter }
    ];
    const result = await runPipeline(
      { tenantId:"demo", runId:"run-42", prompt:"Build a store", agents },
      { auditSecret: process.env.TRUTHSHIELD_AUDIT_SECRET,
        verifierSecret: process.env.TRUTHSHIELD_VERIFIER_SECRET,
        allowedAgents: agents.map(a => a.id) }
    );
    // NEVER publish, merge or deploy unless result.status === "checks_passed"
    // and independent build/deployment evidence also meets YOUR release policy.

The pipeline invokes agents sequentially because their outputs depend on prior agents; within each output inspection, independent validators can run concurrently. Adapters must honor the AbortSignal timeout.

### Optional external validators

    const validators = [{
      id: "dependency-scanner",
      async check(input, {signal}) {
        // Call a trusted sandboxed worker with signal; never exec generated code here.
        // Return [{rule:"DEPENDENCY_ALERT",severity:"review",message:"..."}] or [].
        return [];
      }
    }];

A plugin error or timeout blocks the pipeline. It does not silently skip the failed check.

## Human correction and fixes

- 'inspect' returns findings and hard-stop/review labels.
- 'review' records an approver or correction instructions, without inventing tool proof.
- 'proposeCorrections' creates strictly **non-applied** text-normalization proposals.
- 'proposePatch' and 'reviewPatch' allow a user or repair agent to propose source edits. An authorized human approves a *candidate*, which TruthShield scans again. It never writes to the user's repository. The newly proposed code still needs signed independent compiler/test evidence before you may call it verified.

**Production requirement:** only your trusted orchestration service can issue actual reviewer-scoped approvals; never trust a browser-supplied reviewer name.

## What is NOT finished

This is not yet a complete commercial hosted engine. Before renting access, implement and security-test:

1. A durable PostgreSQL review/evidence/usage ledger with append-only audit retention and encryption.
2. Redis/distributed quotas, idempotency keys, key rotation, abuse controls, organization roles, and permission boundaries.
3. Stripe license/subscription/token-metering integration and a self-service customer API-key console.
4. Hardened isolated containers or VMs that compile and test generated code with strict network, CPU, memory, file, secret, and execution limits.
5. Real adapters to each of the four current AIs and to GitHub CI/Google VM/Hugging Face.
6. Independent factual retrieval/verifier implementations, full security scanning, correctness benchmarks and latency/performance load tests.
7. TLS ingress, monitoring, backups, incident handling, customer retention/deletion controls, and privacy/legal review.

Currently the development API stores reviews **in memory** and rate limits per process. It is not safe to market as a production multi-tenant hosted service yet. No production routes, payments, model weights, Hugging Face files, or deployment settings were modified.

**Safety principle:** The engine can reduce detectable false assertions; it cannot guarantee zero hallucinations, correctness, or security. Only verify what was actually tested and provide evidence.
