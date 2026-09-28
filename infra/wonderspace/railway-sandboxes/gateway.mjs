// Isolated per-sandbox gateway. Never expose code-server directly.
// Only one-time, short-lived signed tickets from the authenticated site may mint sessions.
import http from "node:http";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { URL } from "node:url";
import proxyModule from "http-proxy";

const port = Number(process.env.WONDERSPACE_GATEWAY_PORT || "8080");
const workspace = process.env.WONDERSPACE_WORKSPACE_ID || "";
const secretHex = process.env.WONDERSPACE_GATEWAY_SECRET || "";
const deadline = Number(process.env.WONDERSPACE_SESSION_DEADLINE_MS || "0");
if (!/^[0-9a-f-]{36}$/i.test(workspace) || !/^[a-f0-9]{64,}$/i.test(secretHex) ||
    !Number.isSafeInteger(deadline) || deadline <= Date.now() || port !== 8080) {
  throw new Error("Missing or invalid isolated gateway configuration.");
}
const secret = Buffer.from(secretHex, "hex");
const usedTickets = new Map();
const sessions = new Map();
const proxy = proxyModule.createProxyServer({
  target: "http://127.0.0.1:8081", ws: true, changeOrigin: false,
  xfwd: true, timeout: 30000, proxyTimeout: 30000,
});
function sign(payload) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}
function verifyMac(data, mac) {
  if (!/^[a-zA-Z0-9_-]{43}$/.test(mac)) return false;
  const actual = Buffer.from(sign(data));
  const supplied = Buffer.from(mac);
  return actual.length === supplied.length && timingSafeEqual(actual, supplied);
}
function headers(req, res, code, body) {
  res.writeHead(code, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
}
function hostValid(req) {
  // Railway terminates TLS; hostname must be an assigned public HTTPS sandbox domain.
  const host = req.headers.host || "";
  return /^[a-z0-9-]+\.up\.railway\.app$/i.test(host);
}
function cookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").map(part => {
    const at = part.indexOf("=");
    return at < 0 ? [] : [part.slice(0, at).trim(), part.slice(at + 1).trim()];
  }).filter(pair => pair.length === 2));
}
function authorized(req) {
  const cookie = cookies(req)["__Host-wonderspace"];
  if (!cookie) return false;
  const dot = cookie.lastIndexOf(".");
  if (dot < 1 || !verifyMac(cookie.slice(0, dot), cookie.slice(dot + 1))) return false;
  let data;
  try { data = JSON.parse(Buffer.from(cookie.slice(0, dot), "base64url").toString("utf8")); }
  catch { return false; }
  return data.w === workspace && typeof data.id === "string" &&
    sessions.get(data.id) === data.exp && Number.isSafeInteger(data.exp) &&
    data.exp > Date.now() && Date.now() < deadline;
}
function sameOrigin(req) {
  const origin = req.headers.origin;
  return origin === "https://" + req.headers.host;
}
function handleAuth(req, res) {
  let url;
  try { url = new URL(req.url, "https://" + req.headers.host); }
  catch { return headers(req, res, 400, "Invalid request"); }
  const ticket = url.searchParams.get("ticket") || "";
  if (ticket.length > 2048 || !/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]{43}$/.test(ticket)) {
    return headers(req, res, 401, "Sign in through DreamMakerHub");
  }
  const dot = ticket.lastIndexOf(".");
  const payload = ticket.slice(0, dot);
  if (!verifyMac(payload, ticket.slice(dot + 1))) return headers(req, res, 401, "Invalid sign-in");
  let data;
  try { data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); }
  catch { return headers(req, res, 401, "Invalid sign-in"); }
  const now = Date.now();
  if (data.w !== workspace || typeof data.id !== "string" || data.id.length > 100 ||
      !Number.isSafeInteger(data.exp) || data.exp <= now ||
      data.exp > now + 60000 || now >= deadline || usedTickets.has(data.id)) {
    return headers(req, res, 401, "Expired or reused sign-in");
  }
  usedTickets.set(data.id, data.exp);
  const sid = randomUUID();
  const exp = Math.min(now + 15 * 60000, deadline);
  sessions.set(sid, exp);
  const raw = Buffer.from(JSON.stringify({ w: workspace, id: sid, exp })).toString("base64url");
  res.writeHead(303, {
    Location: "/",
    "Set-Cookie": "__Host-wonderspace=" + raw + "." + sign(raw) +
      "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=" + Math.ceil((exp - now) / 1000),
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
  });
  res.end();
}
proxy.on("error", (_err, _req, res) => {
  if (res && typeof res.writeHead === "function" && !res.headersSent) {
    res.writeHead(502, { "Cache-Control": "no-store" });
    res.end("Workspace temporarily unavailable");
  } else if (res && typeof res.destroy === "function") res.destroy();
});
const server = http.createServer((req, res) => {
  if (!hostValid(req)) return headers(req, res, 421, "Unknown host");
  const path = (req.url || "/").split("?")[0];
  if (path === "/healthz" && req.method === "GET") return headers(req, res, 200, "ok");
  if (Date.now() >= deadline) return headers(req, res, 410, "Workspace session expired");
  if (path === "/auth/start" && req.method === "GET") return handleAuth(req, res);
  if (!authorized(req)) return headers(req, res, 401, "Sign in through DreamMakerHub");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      ((req.headers.origin && !sameOrigin(req)) ||
       req.headers["sec-fetch-site"] === "cross-site")) {
    return headers(req, res, 403, "Wrong origin");
  }
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  proxy.web(req, res);
});
server.on("upgrade", (req, socket, head) => {
  if (!hostValid(req) || Date.now() >= deadline || !authorized(req) || !sameOrigin(req)) {
    socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    return;
  }
  proxy.ws(req, socket, head);
});
server.listen(port, "0.0.0.0");
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of usedTickets) if (expiry < now) usedTickets.delete(key);
  for (const [key, expiry] of sessions) if (expiry < now) sessions.delete(key);
  if (now >= deadline) server.close(() => process.exit(0));
}, 10000).unref();
