import { createServer } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { inspect, review, createReviewedReceipt } from './core.mjs';

const digest = (s) => createHash('sha256').update(s).digest('hex');
const isEqual = (a,b) => /^[a-f0-9]{64}$/i.test(a || '') && /^[a-f0-9]{64}$/i.test(b || '') &&
  timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const send = (res, status, payload) => {
  res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(JSON.stringify(payload));
};
const body = async (req) => {
  let size = 0; const chunks = [];
  for await (const part of req) {
    size += part.length;
    if (size > 2_200_000) throw Error('Request too large');
    chunks.push(part);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};
function configFromEnv() {
  const entries = JSON.parse(process.env.TRUTHSHIELD_KEYS_JSON || '[]');
  if (!Array.isArray(entries) || entries.length === 0) throw Error('TRUTHSHIELD_KEYS_JSON must contain SHA-256 API key hashes before API can start');
  for (const e of entries) {
    if (typeof e.id !== 'string' || typeof e.tenantId !== 'string' ||
      !/^[a-f0-9]{64}$/i.test(e.sha256 || '') || !Array.isArray(e.scopes)) throw Error('Invalid API key configuration');
  }
  const allowed = JSON.parse(process.env.TRUTHSHIELD_AGENTS_JSON || '{}');
  return { entries, allowed };
}
export function createTruthShieldServer(options = {}) {
  const { entries, allowed } = options.entries ? options : configFromEnv();
  const reports = new Map(); // DEV ONLY: use tenant-scoped persistent DB before taking paying customers.
  const quotas = new Map(); // DEV ONLY: Redis or distributed rate limiting required in production.
  const maxRequestsPerMinute = options.rateLimit ?? 120;
  const verifierSecret = options.verifierSecret ?? process.env.TRUTHSHIELD_VERIFIER_SECRET;
  const auditSecret = options.auditSecret ?? process.env.TRUTHSHIELD_AUDIT_SECRET;
  const server = createServer(async (req,res) => {
    try {
      if (req.method === 'GET' && req.url === '/health') return send(res,200,{ok:true,service:'truthshield'});
      const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
      if (!token || token.length > 512) return send(res,401,{error:'Unauthorized'});
      const tokenHash = digest(token);
      const key = entries.find(k => isEqual(k.sha256,tokenHash));
      if (!key) return send(res,401,{error:'Unauthorized'});
      const timeBucket = Math.floor(Date.now() / 60000);
      const quotaKey = key.id + ':' + timeBucket;
      const n = (quotas.get(quotaKey) || 0) + 1;
      quotas.set(quotaKey,n);
      if (quotas.size > 10000) quotas.clear();
      if (n > maxRequestsPerMinute) return send(res,429,{error:'Rate limit exceeded'});
      if (req.method === 'POST' && req.url === '/v1/scan') {
        if (!key.scopes.includes('scan')) return send(res,403,{error:'Insufficient scope'});
        const input = await body(req);
        if (input.tenantId && input.tenantId !== key.tenantId) return send(res,403,{error:'Tenant mismatch'});
        input.tenantId = key.tenantId;
        const allowedAgents = allowed?.[key.tenantId] || options.allowedAgents;
        const result = await inspect(input,{verifierSecret,auditSecret,allowedAgents});
        reports.set(result.reportHash,result);
        if (reports.size > 10000) reports.delete(reports.keys().next().value);
        return send(res,200,result);
      }
      if (req.method === 'POST' && req.url === '/v1/reviews') {
        if (!key.scopes.includes('review')) return send(res,403,{error:'Insufficient scope'});
        const request = await body(req);
        if (!request || typeof request.reportHash !== 'string') return send(res,400,{error:'Missing report hash'});
        const report = reports.get(request.reportHash);
        if (!report || report.tenantId !== key.tenantId) return send(res,404,{error:'Review case not found'});
        const response = review(report, { reviewer: key.id, action: request.action,
          reason: request.reason, correctionInput: request.correctionInput });
        if (response.status === 'human_approved_unverified') {
          if (!auditSecret || auditSecret.length < 32) return send(res,503,{error:'Audit signing is not configured; cannot authorize reviewed handoff'});
          response.reviewedReceipt = createReviewedReceipt(report,response,auditSecret);
        }
        return send(res,200,response);
      }
      return send(res,404,{error:'Not found'});
    } catch (err) {
      return send(res,400,{error:err instanceof Error ? err.message : 'Invalid request'});
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 8000;
  return server;
}
export async function startServer(options = {}) {
  const server = createTruthShieldServer(options);
  const port = options.port || 8742;
  await new Promise((resolve,reject) => { server.once('error',reject); server.listen(port,'127.0.0.1',resolve); });
  process.stdout.write('TruthShield development API listening at http://127.0.0.1:' + port + '\n');
  return server;
}
