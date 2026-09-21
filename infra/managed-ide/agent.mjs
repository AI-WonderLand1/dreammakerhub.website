// Node 20+, Kubernetes in-cluster agent. Only operator-approved, digest-pinned Linux images.
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import crypto from 'node:crypto';

const account = '/var/run/secrets/kubernetes.io/serviceaccount/';
const namespace = fs.readFileSync(`${account}namespace`, 'utf8').trim();
const k8sToken = fs.readFileSync(`${account}token`, 'utf8').trim();
const ca = fs.readFileSync(`${account}ca.crt`);
const secret = process.env.IDE_AGENT_SECRET || '';
const image = process.env.IDE_LINUX_IMAGE || '';
const origin = process.env.IDE_PUBLIC_ORIGIN || '';
if (Buffer.byteLength(secret) < 32 || !/^https:\/\/[^/]+$/.test(origin) ||
  !/^[a-z0-9][a-z0-9._:\/-]+@sha256:[a-f0-9]{64}$/.test(image)) {
  throw new Error('IDE_AGENT_SECRET (32+ bytes), IDE_PUBLIC_ORIGIN (HTTPS), and digest-pinned IDE_LINUX_IMAGE required');
}
if (!process.env.KUBERNETES_SERVICE_HOST) throw new Error('Run the agent inside Kubernetes');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const replay = new Map();
const hash = text => crypto.createHash('sha256').update(text).digest('hex').slice(0, 32);
const mac = text => crypto.createHmac('sha256', secret).update(text).digest('base64url');
const name = id => `ide-${id}`;
function eq(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function sign(object) {
  const payload = Buffer.from(JSON.stringify(object)).toString('base64url');
  return `${payload}.${mac(payload)}`;
}
function verify(raw) {
  if (!raw || raw.length > 2048) return null;
  const [payload, signature, extra] = raw.split('.');
  if (!payload || !signature || extra || !eq(mac(payload), signature)) return null;
  try {
    const object = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!uuid.test(object.id) || !uuid.test(object.uid) ||
      !Number.isSafeInteger(object.exp) || object.exp < Date.now() / 1000 ||
      object.exp > Date.now() / 1000 + 3610) return null;
    return object;
  } catch { return null; }
}
function send(res, code, value) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(value));
}
function cookie(req, cookieName) {
  return (req.headers.cookie || '').split(';').map(s => s.trim())
    .find(s => s.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
}
function cleanupReplay() {
  for (const [key, expiry] of replay) if (expiry < Date.now()) replay.delete(key);
}
async function kube(method, resource, body) {
  const payload = body === undefined ? null : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: process.env.KUBERNETES_SERVICE_HOST,
      port: process.env.KUBERNETES_SERVICE_PORT || '443',
      path: `/api/v1/namespaces/${namespace}/${resource}`, method, ca, timeout: 10000,
      headers: { Authorization: `Bearer ${k8sToken}`, Accept: 'application/json',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}) } }, res => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { raw += chunk; if (raw.length > 200000) res.destroy(); });
      res.on('end', () => { let value; try { value = JSON.parse(raw); } catch { value = {}; }
        resolve({ status: res.statusCode, value }); });
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('Kubernetes timeout')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}
async function ensure(type, id, uid, manifest) {
  const existing = await kube('GET', `${type}/${name(id)}`);
  if (existing.status === 200) {
    if (existing.value.metadata?.labels?.['dreammakerhub.io/owner'] !== hash(uid)) throw new Error('Owner mismatch');
    if (type === 'pods' && existing.value.spec?.containers?.[0]?.image !== image) throw new Error('Image mismatch');
    return existing.value;
  }
  if (existing.status !== 404) throw new Error(`Kubernetes lookup ${existing.status}`);
  const created = await kube('POST', type, manifest);
  if (created.status === 409) return ensure(type, id, uid, manifest);
  if (created.status !== 201) throw new Error(`Kubernetes create ${created.status}`);
  return created.value;
}
async function ownedPod(id, uid) {
  const response = await kube('GET', `pods/${name(id)}`);
  if (response.status === 404) return null;
  if (response.status !== 200 || response.value.metadata?.labels?.['dreammakerhub.io/owner'] !== hash(uid)) throw new Error('Workspace not accessible');
  return response.value;
}
async function provision(data) {
  const { id, userId, imageKey } = data;
  if (!uuid.test(id) || !uuid.test(userId) || imageKey !== 'linux') throw new Error('Invalid workspace/image');
  const labels = { 'app.kubernetes.io/name': 'dreammaker-ide', 'dreammakerhub.io/owner': hash(userId), 'dreammakerhub.io/workspace': id };
  const metadata = { name: name(id), labels };
  await ensure('persistentvolumeclaims', id, userId, { apiVersion: 'v1', kind: 'PersistentVolumeClaim', metadata,
    spec: { storageClassName: 'local-path', accessModes: ['ReadWriteOnce'], resources: { requests: { storage: '10Gi' } } } });
  await ensure('pods', id, userId, { apiVersion: 'v1', kind: 'Pod', metadata,
    spec: { serviceAccountName: 'ide-workspace', automountServiceAccountToken: false,
      securityContext: { runAsUser: 1000, runAsGroup: 1000, fsGroup: 1000, seccompProfile: { type: 'RuntimeDefault' } },
      containers: [{ name: 'editor', image, imagePullPolicy: 'Always',
        command: ['code-server'], args: ['--auth', 'none', '--bind-addr', '0.0.0.0:8080', '/home/coder/project'],
        ports: [{ containerPort: 8080, name: 'http' }],
        resources: { requests: { cpu: '250m', memory: '512Mi' }, limits: { cpu: '2', memory: '4Gi' } },
        securityContext: { allowPrivilegeEscalation: false, capabilities: { drop: ['ALL'] } },
        readinessProbe: { httpGet: { path: '/healthz', port: 8080 }, periodSeconds: 5, failureThreshold: 12 },
        volumeMounts: [{ name: 'home', mountPath: '/home/coder' }, { name: 'tmp', mountPath: '/tmp' }] }],
      volumes: [{ name: 'home', persistentVolumeClaim: { claimName: name(id) } }, { name: 'tmp', emptyDir: { sizeLimit: '1Gi' } }] } });
  await ensure('services', id, userId, { apiVersion: 'v1', kind: 'Service', metadata,
    spec: { type: 'ClusterIP', selector: { 'dreammakerhub.io/workspace': id }, ports: [{ port: 8080, targetPort: 8080, name: 'http' }] } });
  return { id, status: 'provisioning' };
}
function upstream(id, path) { return { hostname: `${name(id)}.${namespace}.svc.cluster.local`, port: 8080, path: path || '/' }; }
function upstreamHeaders(req) {
  const headers = { ...req.headers };
  for (const key of ['host', 'cookie', 'authorization', 'proxy-authorization', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'connection', 'upgrade', 'transfer-encoding']) delete headers[key];
  headers.host = 'localhost:8080'; headers['x-forwarded-proto'] = 'https';
  return headers;
}
async function access(req, id) {
  if (req.headers.origin && req.headers.origin !== origin) return null;
  const session = verify(cookie(req, `dm_ide_${id.replaceAll('-', '')}`));
  if (!session || session.kind !== 'session' || session.id !== id) return null;
  const pod = await ownedPod(id, session.uid);
  if (!pod) return null;
  return { ready: pod.status?.conditions?.some(c => c.type === 'Ready' && c.status === 'True') };
}
function proxy(req, res, id, path) {
  const request = http.request({ ...upstream(id, path), method: req.method, headers: upstreamHeaders(req), timeout: 30000 }, response => {
    const headers = { ...response.headers }; delete headers['set-cookie'];
    if (typeof headers.location === 'string' && headers.location.startsWith('/')) headers.location = `/w/${id}${headers.location}`;
    headers['cache-control'] = 'private, no-store';
    res.writeHead(response.statusCode || 502, headers); response.pipe(res);
  });
  request.on('error', () => { if (!res.headersSent) send(res, 502, { error: 'IDE unavailable' }); else res.destroy(); });
  request.on('timeout', () => request.destroy());
  req.pipe(request);
}
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', origin);
    if (url.pathname === '/healthz') return send(res, 200, { status: 'ok' });
    if (req.method === 'POST' && url.pathname === '/internal/provision') {
      let body = '';
      for await (const chunk of req) { body += chunk.toString('utf8'); if (Buffer.byteLength(body) > 4096) return send(res, 413, { error: 'Too large' }); }
      const timestamp = Number(req.headers['x-ide-timestamp']);
      const signature = req.headers['x-ide-signature'];
      cleanupReplay();
      if (!Number.isSafeInteger(timestamp) || Math.abs(Date.now() - timestamp) > 60000 ||
        !eq(signature, mac(`${timestamp}.${body}`)) || replay.has(`request:${signature}`)) return send(res, 401, { error: 'Unauthorized' });
      replay.set(`request:${signature}`, Date.now() + 60000);
      let data; try { data = JSON.parse(body); } catch { return send(res, 400, { error: 'Invalid JSON' }); }
      return send(res, 202, await provision(data));
    }
    if (req.method === 'GET' && url.pathname === '/connect') {
      cleanupReplay();
      const ticket = verify(url.searchParams.get('ticket'));
      if (!ticket || ticket.kind !== 'ticket' || ticket.exp > Date.now() / 1000 + 90 ||
          !ticket.nonce || replay.has(`ticket:${ticket.nonce}`)) return send(res, 401, { error: 'Invalid ticket' });
      if (!await ownedPod(ticket.id, ticket.uid)) return send(res, 404, { error: 'Workspace not found' });
      replay.set(`ticket:${ticket.nonce}`, Date.now() + 90000);
      const session = sign({ kind: 'session', id: ticket.id, uid: ticket.uid, exp: Math.floor(Date.now() / 1000) + 3600 });
      res.writeHead(303, { Location: `/w/${ticket.id}/`, 'Set-Cookie': `dm_ide_${ticket.id.replaceAll('-', '')}=${session}; Path=/w/${ticket.id}/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
      return res.end();
    }
    const match = url.pathname.match(/^\/w\/([0-9a-f-]{36})(\/.*)?$/);
    if (!match || !uuid.test(match[1])) return send(res, 404, { error: 'Not found' });
    const id = match[1];
    const state = await access(req, id);
    if (!state) return send(res, 403, { error: 'Session expired. Open your workspace from DreamMakerHub again.' });
    if (!state.ready) {
      res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', Refresh: '5' });
      return res.end('<!doctype html><meta charset="utf-8"><title>Starting IDE</title><body style="background:#0c1020;color:white;font:18px system-ui;padding:3rem">Your private IDE is starting. This page refreshes automatically.</body>');
    }
    return proxy(req, res, id, `${match[2] || '/'}${url.search}`);
  } catch { if (!res.headersSent) send(res, 503, { error: 'IDE service temporarily unavailable' }); else res.destroy(); }
});
server.on('upgrade', async (req, socket, head) => {
  try {
    const url = new URL(req.url || '/', origin);
    const match = url.pathname.match(/^\/w\/([0-9a-f-]{36})(\/.*)?$/);
    if (!match || !uuid.test(match[1]) || req.headers.origin !== origin || !(await access(req, match[1]))?.ready) throw new Error('Forbidden');
    const upstreamRequest = http.request({ ...upstream(match[1], `${match[2] || '/'}${url.search}`),
      headers: { ...upstreamHeaders(req), connection: 'Upgrade', upgrade: 'websocket' }, timeout: 15000 });
    upstreamRequest.on('upgrade', (response, connection, upstreamHead) => {
      socket.write(`HTTP/1.1 101 Switching Protocols\r\n${Object.entries(response.headers).map(([key, value]) => `${key}: ${value}`).join('\r\n')}\r\n\r\n`);
      if (head.length) connection.write(head);
      if (upstreamHead.length) socket.write(upstreamHead);
      socket.pipe(connection).pipe(socket);
      connection.on('error', () => socket.destroy());
    });
    upstreamRequest.on('response', () => socket.destroy());
    upstreamRequest.on('error', () => socket.destroy());
    upstreamRequest.end();
  } catch { socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); }
});
server.listen(3000, '0.0.0.0');
