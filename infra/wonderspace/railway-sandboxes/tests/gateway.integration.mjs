import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const HOST = "sandbox-test.up.railway.app";
const SECRET = "ab".repeat(32);
const WORKSPACE = randomUUID();
const SERVER = "http://127.0.0.1:8080";
function ticket() {
  const payload = Buffer.from(JSON.stringify({
    w: WORKSPACE, id: randomUUID(), exp: Date.now() + 45000,
  })).toString("base64url");
  return payload + "." + createHmac("sha256", Buffer.from(SECRET, "hex"))
    .update(payload).digest("base64url");
}
async function request(path, extras = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: "127.0.0.1", port: 8080, path, method: extras.method || "GET",
      headers: { Host: HOST, ...(extras.headers || {}) },
    }, response => {
      const chunks = [];
      response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => resolve({
        status: response.statusCode,
        headers: { get: key => response.headers[key.toLowerCase()] || null },
        text: async () => Buffer.concat(chunks).toString("utf8"),
      }));
    });
    request.on("error", reject);
    request.end(extras.body);
  });
}
function websocketAttempt(cookie) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(8080, "127.0.0.1");
    socket.setTimeout(2000);
    socket.once("timeout", () => { socket.destroy(); reject(new Error("WebSocket test timeout")); });
    socket.once("error", reject);
    socket.once("connect", () => socket.write([
      "GET / HTTP/1.1", "Host: " + HOST, "Connection: Upgrade",
      "Upgrade: websocket", "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==",
      "Sec-WebSocket-Version: 13", "Origin: https://attacker.example",
      "Cookie: " + cookie, "", "",
    ].join("\r\n")));
    socket.once("data", chunk => { socket.end(); resolve(chunk.toString("utf8")); });
  });
}
test("gateway rejects anonymous users, replayed tickets and cross-origin websocket access", async () => {
  const backend = http.createServer((_req, res) => res.end("isolated code-server mock"));
  await new Promise(resolve => backend.listen(8081, "127.0.0.1", resolve));
  const child = spawn(process.execPath, ["gateway.mjs"], {
    cwd: new URL("..", import.meta.url).pathname,
    env: {
      ...process.env,
      WONDERSPACE_WORKSPACE_ID: WORKSPACE,
      WONDERSPACE_GATEWAY_SECRET: SECRET,
      WONDERSPACE_SESSION_DEADLINE_MS: String(Date.now() + 90000),
      WONDERSPACE_GATEWAY_PORT: "8080",
    },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", chunk => { stderr += chunk.toString(); });
  try {
    let ready = false;
    let lastHealthStatus = 'no response';
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        const health = await request("/healthz");
        lastHealthStatus = health.status;
        if (health.status === 200) { ready = true; break; }
      } catch {}
      await delay(100);
    }
    assert.ok(ready, "Gateway did not become healthy (last HTTP status: " + lastHealthStatus + "): " + stderr);
    assert.equal((await request("/")).status, 401);
    const link = "/auth/start?ticket=" + encodeURIComponent(ticket());
    const login = await request(link);
    assert.equal(login.status, 303);
    assert.equal(login.headers.get("location"), "/");
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie?.startsWith("__Host-wonderspace="));
    assert.equal((await request(link)).status, 401, "Ticket replay must be rejected");
    const good = await request("/", { headers: { Cookie: cookie } });
    assert.equal(good.status, 200);
    assert.equal(await good.text(), "isolated code-server mock");
    assert.equal((await request("/", { method: "POST", headers: {
      Cookie: cookie, Origin: "https://attacker.example",
    } })).status, 403);
    const denied = await websocketAttempt(cookie);
    assert.match(denied, /403 Forbidden/);
  } finally {
    child.kill("SIGTERM");
    backend.close();
  }
});
