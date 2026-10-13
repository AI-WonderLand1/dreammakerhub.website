import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const HEX = /^[a-f0-9]{64}$/i;
const SLUG = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/;
const CLAIM_KINDS = new Set(['build', 'test', 'deployment', 'fact', 'security']);
const EVIDENCE_VALID_FOR = { build: 'build', test: 'test', deployment: 'deployment', fact: 'fact', security: 'security' };
const LEAKS = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ['github-token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/g],
  ['stripe-secret', /\bsk_(?:live|test)_[A-Za-z0-9]{12,}\b/g],
  ['aws-access-key', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g],
  ['openai-key', /\bsk-proj-[A-Za-z0-9_-]{20,}\b/g],
];

export function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}
export function artifactHash(candidate) {
  const ordered = [...(candidate.files || [])].sort((a,b) => a.path.localeCompare(b.path));
  return hash(JSON.stringify({ text: candidate.text || '', files: ordered }));
}
function sign(payload, secret) {
  return createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
}
function secureEqual(a,b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !HEX.test(a) || !HEX.test(b)) return false;
  return timingSafeEqual(Buffer.from(a,'hex'), Buffer.from(b,'hex'));
}
export function signEvidence(payload, verifierSecret) {
  if (typeof verifierSecret !== 'string' || verifierSecret.length < 32) throw Error('Trusted verifier secret must contain 32 or more characters');
  return { ...payload, signature: sign(payload, verifierSecret) };
}
function evidenceValid(e, secret, expected) {
  if (!secret || secret.length < 32 || !e || typeof e !== 'object') return false;
  const { signature, ...payload } = e;
  if (!secureEqual(signature, sign(payload, secret))) return false;
  if (e.tenantId !== expected.tenantId || e.runId !== expected.runId || e.artifactHash !== expected.artifactHash) return false;
  if (!CLAIM_KINDS.has(e.kind) || !['passed','failed'].includes(e.status)) return false;
  if (typeof e.timestamp !== 'string') return false;
  const ts = Date.parse(e.timestamp);
  return Number.isFinite(ts) && Math.abs(Date.now() - ts) <= 60 * 60 * 1000;
}
export function createReceipt(report, auditSecret) {
  if (typeof auditSecret !== 'string' || auditSecret.length < 32) throw Error('Receipt signing unavailable');
  const payload = { tenantId: report.tenantId, runId: report.runId, agentId: report.agentId,
    artifactHash: report.artifactHash, decision: report.decision, reportHash: report.reportHash };
  return { ...payload, signature: sign(payload, auditSecret) };
}
export function createReviewedReceipt(report, reviewerDecision, auditSecret) {
  if (!report || report.decision !== 'needs_human_review' ||
      reviewerDecision?.caseId !== report.reportHash ||
      reviewerDecision?.status !== 'human_approved_unverified') throw Error('Only approved matching human review can continue a hold');
  const reviewed = { ...report, decision:'human_approved_unverified' };
  return createReceipt(reviewed, auditSecret);
}
export function verifyReceipt(receipt, auditSecret) {
  if (!receipt || !auditSecret || auditSecret.length < 32) return false;
  const { signature, ...payload } = receipt;
  return secureEqual(signature, sign(payload, auditSecret)) &&
    ['approved','human_approved_unverified'].includes(receipt.decision);
}
function assertInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Input must be an object');
  for (const field of ['tenantId','agentId','runId']) {
    if (typeof input[field] !== 'string' || !SLUG.test(input[field])) throw Error('Invalid ' + field);
  }
  if (!input.candidate || typeof input.candidate !== 'object' || Array.isArray(input.candidate)) throw Error('Missing candidate');
  const { text, files = [] } = input.candidate;
  if (typeof text !== 'string' || text.length > 250_000 || !Array.isArray(files) || files.length > 100) throw Error('Candidate exceeds size limits');
  let bytes = text.length;
  for (const file of files) {
    if (!file || typeof file.path !== 'string' || typeof file.content !== 'string' || file.content.length > 1_000_000) throw Error('Invalid file');
    bytes += file.content.length;
  }
  if (bytes > 2_000_000) throw Error('Candidate total exceeds 2MB limit');
  if (!Array.isArray(input.claims || []) || (input.claims || []).length > 200) throw Error('Invalid claims');
  if (!Array.isArray(input.evidence || []) || (input.evidence || []).length > 200) throw Error('Invalid evidence');
  return files;
}
function finding(rule, severity, message, subject = 'response') {
  return { rule, severity, message, subject };
}
function inspectFile(file) {
  const out = [];
  const path = file.path;
  if (path.length > 500 || path.startsWith('/') || path.includes('\\') || path.split('/').some(x => x === '..' || x === '.' || x === '')) {
    out.push(finding('UNSAFE_PATH','block','File path must be relative and cannot traverse directories',path.slice(0,180)));
    return out;
  }
  if (path.endsWith('.json')) {
    try { JSON.parse(file.content); } catch {
      out.push(finding('INVALID_JSON','review','JSON syntax is invalid; replace with reviewed correction',path));
    }
  }
  if (/\b(?:eval\s*\(|new\s+Function\s*\(|curl\b[^\n]{0,100}\|\s*(?:sh|bash))/.test(file.content)) {
    out.push(finding('DANGEROUS_EXECUTION','review','Potential dynamic or remote code execution requires a sandboxed security review',path));
  }
  return out;
}
function inspectSecrets(content, subject) {
  const results = [];
  for (const [name, regex] of LEAKS) {
    regex.lastIndex = 0;
    if (regex.test(content)) results.push(finding('SECRET_' + name.toUpperCase().replaceAll('-','_'),
      'block','Potential secret detected; it has not been echoed in this report', subject));
  }
  return results;
}
function unverifiedClaims(text) {
  return /\b(?:i|we|alice|the agent)\s+(?:have\s+)?(?:ran|tested|verified|deployed|published|fixed)\b|\b(?:all tests pass|build succeeded|production is live)\b/i.test(text);
}
export async function inspect(input, options = {}) {
  const began = performance.now();
  const files = assertInput(input);
  const allowed = options.allowedAgents;
  if (allowed && !allowed.includes(input.agentId)) throw Error('Agent is not registered for this tenant');
  const digest = artifactHash(input.candidate);
  const expected = { tenantId: input.tenantId, runId: input.runId, artifactHash: digest };
  const seenPaths = new Set();
  // Independent deterministic passes. They never execute candidate code or call an AI model.
  const [structural, leakFindings, fileFindings, claimFindings, handoffFindings] = await Promise.all([
    Promise.resolve().then(() => {
      const f = [];
      for (const file of files) {
        if (seenPaths.has(file.path)) f.push(finding('DUPLICATE_PATH','block','Duplicate output path',file.path));
        seenPaths.add(file.path);
      }
      return f;
    }),
    Promise.resolve().then(() => [ ...inspectSecrets(input.candidate.text,'response'),
      ...files.flatMap(file => inspectSecrets(file.content,file.path)) ]),
    Promise.resolve().then(() => files.flatMap(inspectFile)),
    Promise.resolve().then(() => {
      const f = [];
      const all = input.evidence || [];
      const claims = input.claims || [];
      const trusted = new Map(all.filter(e => evidenceValid(e, options.verifierSecret, expected)).map(e => [e.id,e]));
      const invalid = all.length - trusted.size;
      if (invalid > 0) f.push(finding('UNTRUSTED_EVIDENCE','review','One or more evidence records are untrusted, stale, or unrelated to this output'));
      for (const claim of claims) {
        if (!claim || !CLAIM_KINDS.has(claim.kind) || typeof claim.statement !== 'string') {
          f.push(finding('INVALID_CLAIM','review','Unsupported or malformed claim')); continue;
        }
        const support = (Array.isArray(claim.evidenceIds) ? claim.evidenceIds : []).map(id => trusted.get(id))
          .filter(e => e && e.kind === EVIDENCE_VALID_FOR[claim.kind]);
        if (support.some(e => e.status === 'failed')) {
          f.push(finding('FAILED_PROOF','block','Trusted verification explicitly failed for claim: ' + claim.kind)); continue;
        }
        if (!support.some(e => e.status === 'passed')) {
          f.push(finding('UNVERIFIED_CLAIM','review','No trusted passing evidence for claim: ' + claim.kind));
        }
      }
      if (unverifiedClaims(input.candidate.text) && claims.length === 0) {
        f.push(finding('UNSUPPORTED_SUCCESS_STATEMENT','review','Response asserts completed work but supplies no structured claims and trusted verification'));
      }
      return f;
    }),
    Promise.resolve().then(() => {
      if (input.stage !== 'handoff' && input.stage !== 'publish' && input.stage !== 'deploy') return [];
      if (!input.previous || !verifyReceipt(input.previous, options.auditSecret)) {
        return [finding('UNVERIFIED_HANDOFF','review','Handoff or release is missing a trusted prior-agent receipt')];
      }
      if (input.previous.tenantId !== input.tenantId || input.previous.runId !== input.runId) {
        return [finding('FOREIGN_HANDOFF','block','Previous receipt belongs to another tenant or run')];
      }
      if (input.previous.agentId === input.agentId) {
        return [finding('SELF_ATTESTED_HANDOFF','review','An agent cannot attest its own prior approval')];
      }
      return [];
    }),
  ]);
  const findings = [...structural, ...leakFindings, ...fileFindings, ...claimFindings, ...handoffFindings]
    .map((f,i) => ({ id: 'f' + (i+1), ...f }));
  const decision = findings.some(f => f.severity === 'block') ? 'blocked' :
    findings.some(f => f.severity === 'review') ? 'needs_human_review' : 'approved';
  const result = {
    schemaVersion: '1', tenantId: input.tenantId, runId: input.runId, agentId: input.agentId,
    stage: input.stage || 'draft', artifactHash: digest, previousReportHash: input.previous?.reportHash || null,
    decision, label: decision === 'approved' ? 'CHECKS_PASSED_NOT_FACTUALLY_GUARANTEED' :
      decision === 'blocked' ? 'HARD_STOP' : 'HUMAN_REVIEW_REQUIRED',
    findings, checksExecuted: ['shape','path','secret-patterns','json','execution-patterns','evidence','handoff'],
    verificationScope: 'Deterministic checks plus independently signed evidence only; no external factual verification or code execution',
  };
  result.reportHash = hash(JSON.stringify(result));
  result.metrics = { durationMs: Math.round((performance.now()-began)*1000)/1000, findings: findings.length };
  if (options.auditSecret?.length >= 32) result.receipt = createReceipt(result, options.auditSecret);
  return result;
}
export function review(report, input) {
  if (!report || !['approved','blocked','needs_human_review'].includes(report.decision) ||
      typeof report.reportHash !== 'string') throw Error('Invalid report');
  if (!input || !SLUG.test(input.reviewer || '') ||
      !['approve','reject','request_changes'].includes(input.action) ||
      typeof input.reason !== 'string' || input.reason.trim().length < 12 ||
      input.reason.length > 4000) throw Error('Reviewer identity, action, and reason required');
  if (report.decision === 'blocked' && input.action === 'approve') throw Error('Hard stop cannot be overridden');
  if (input.action === 'approve' && report.decision !== 'needs_human_review') throw Error('Only review-required reports can be approved');
  const result = {
    caseId: report.reportHash, tenantId: report.tenantId, runId: report.runId, reviewer: input.reviewer,
    action: input.action, reason: input.reason, correctionInput: String(input.correctionInput || '').slice(0,5000),
    status: input.action === 'approve' ? 'human_approved_unverified' :
      input.action === 'request_changes' ? 'waiting_for_corrected_output' : 'rejected',
    warning: 'Review never changes a failed test into a pass. Any revised artifact must be re-scanned.',
    createdAt: new Date().toISOString(),
  };
  result.auditHash = hash(JSON.stringify(result));
  return result;
}
export function proposeCorrections(input, report) {
  if (artifactHash(input.candidate) !== report.artifactHash) throw Error('Artifact changed since scan');
  const changes = [];
  for (const file of input.candidate.files || []) {
    if (!/\r\n/.test(file.content)) continue;
    // Whitespace-only proposal. The caller must review and re-scan; never writes files.
    changes.push({ path: file.path, operation: 'normalize-crlf', beforeHash: hash(file.content),
      after: file.content.replace(/\r\n/g,'\n'), requiresHumanApproval: true });
  }
  return { reportHash: report.reportHash, decision: report.decision,
    status: 'PROPOSED_NOT_APPLIED', changes,
    instructions: 'Human must approve changes, then re-run every check on the revised output.' };
}
