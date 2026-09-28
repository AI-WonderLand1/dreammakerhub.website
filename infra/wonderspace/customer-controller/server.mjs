import http from "node:http";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { Sandbox } from "railway";

const required = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY",
  "RAILWAY_API_TOKEN", "RAILWAY_ENVIRONMENT_ID", "WONDERSPACE_GATEWAY_MASTER_SECRET"];
for (const name of required) {
  if (!process.env[name]) throw new Error("Missing required private controller variable: " + name);
}
const master = process.env.WONDERSPACE_GATEWAY_MASTER_SECRET;
if (!/^[a-f0-9]{64,}$/i.test(master)) throw new Error("Gateway master secret must be at least 32 random bytes, hex encoded.");
if (process.env.WONDERSPACE_CUSTOMER_RUNTIME_ENABLED === "true" &&
    (!process.env.WONDERSPACE_TESTER_USER_IDS || !process.env.WONDERSPACE_MONTHLY_RESERVED_MINUTES)) {
  throw new Error("Customer sandbox runtime cannot open without an explicit tester allowlist and budget.");
}
const DURATION_MINUTES = 10; // Customer gets ten minutes, fifteen reserved for cleanup margin.
const RESERVATION_MINUTES = 15;
const MAX_ACTIVE = 1;
const MAX_WORKSPACES_PER_TESTER = 3;
const MAX_ARCHIVE_BYTES = 16 * 1024 * 1024;
const BUCKET = "wonderspace-customer-snapshots";
const CHECKPOINT = "wonderspace-clean-v1";
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const NAME = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;
const publicDb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const busy = new Set();
const testerIds = new Set((process.env.WONDERSPACE_TESTER_USER_IDS || "")
  .split(",").map(s => s.trim()).filter(s => UUID.test(s)));
function gate() {
  if (process.env.WONDERSPACE_CUSTOMER_RUNTIME_ENABLED !== "true" || testerIds.size === 0) {
    throw new HttpError(503, "Customer sandbox access is disabled until safety tests are verified.");
  }
}
function monthlyBudget() {
  const raw = process.env.WONDERSPACE_MONTHLY_RESERVED_MINUTES;
  const n = Number(raw);
  if (!/^\d+$/.test(raw || "") || !Number.isSafeInteger(n) || n < 15 || n > 60) {
    throw new HttpError(503, "Operator-set sandbox budget is missing or outside the verified test range.");
  }
  return n;
}
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" });
  res.end(JSON.stringify(body));
}
async function authenticated(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match || match[1].length > 6000) throw new HttpError(401, "Valid DreamMakerHub login required.");
  const result = await publicDb.auth.getUser(match[1]);
  if (result.error || !result.data.user) throw new HttpError(401, "DreamMakerHub login expired.");
  return result.data.user;
}
async function input(req) {
  if (req.headers["content-length"] && Number(req.headers["content-length"]) > 4096) {
    throw new HttpError(413, "Request too large");
  }
  let body = "";
  for await (const part of req) {
    body += part.toString("utf8");
    if (body.length > 4096) throw new HttpError(413, "Request too large");
  }
  try { return body ? JSON.parse(body) : {}; }
  catch { throw new HttpError(400, "Invalid JSON"); }
}
async function byOwner(userId, id) {
  if (!UUID.test(id)) throw new HttpError(404, "Workspace not found");
  const { data, error } = await db.from("wonderspace_sandbox_workspaces")
    .select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw new HttpError(503, "Workspace storage unavailable");
  if (!data) throw new HttpError(404, "Workspace not found");
  return data;
}
function publicWorkspace(row) {
  return { id: row.id, name: row.name, state: row.state,
    createdAt: row.created_at, expiresAt: row.expires_at,
    lastSavedAt: row.last_autosave_at, snapshotVersion: row.snapshot_version,
    error: row.last_error_code ? "Workspace requires recovery; contact support." : null };
}
function deriveSecret(row) {
  if (!UUID.test(row.session_nonce || "")) throw new HttpError(503, "Session metadata unavailable");
  return createHmac("sha256", Buffer.from(master, "hex"))
    .update(row.id + ":" + row.session_nonce).digest("hex");
}
function domainName(sandbox) {
  for (const item of sandbox.domains || []) {
    const d = String(item.domain || "").replace(/^https:\/\//, "");
    if (/^[a-z0-9-]+\.up\.railway\.app$/i.test(d) && item.port === 8080) return d;
  }
  throw new HttpError(503, "The sandbox did not publish its secure gateway");
}
async function checked(command, sandbox, timeoutSec = 35) {
  const result = await sandbox.exec(command, { timeoutSec });
  if (result.exitCode !== 0 || result.timedOut) throw new HttpError(503, "Sandbox command failed");
}
async function background(sandbox, command) {
  const task = sandbox.exec(command);
  await task.sessionName;
  await task.detach();
}
async function restoreArchive(sandbox, row) {
  if (!row.snapshot_path) return;
  if (!row.snapshot_sha256 || !/^[a-f0-9]{64}$/.test(row.snapshot_sha256)) {
    throw new HttpError(503, "Last snapshot failed integrity metadata checks");
  }
  const result = await db.storage.from(BUCKET).download(row.snapshot_path);
  if (result.error || !result.data) throw new HttpError(503, "Last private snapshot is not accessible");
  const bytes = Buffer.from(await result.data.arrayBuffer());
  if (bytes.length > MAX_ARCHIVE_BYTES ||
      createHash("sha256").update(bytes).digest("hex") !== row.snapshot_sha256) {
    throw new HttpError(503, "Last snapshot failed integrity verification");
  }
  await sandbox.files.write("/tmp/wonderspace-restore.tar.gz", bytes);
  await checked("runuser -u coder -- python3 /opt/wonderspace/restore.py", sandbox);
}
async function saveArchive(sandbox, row) {
  await checked("runuser -u coder -- python3 /opt/wonderspace/export.py", sandbox, 45);
  const bytes = Buffer.from(await sandbox.files.read("/tmp/wonderspace-save.tar.gz", { format: "bytes" }));
  if (!bytes.length || bytes.length > MAX_ARCHIVE_BYTES) throw new HttpError(503, "Snapshot size invalid");
  const hash = createHash("sha256").update(bytes).digest("hex");
  const path = row.user_id + "/" + row.id + "/" + randomUUID() + ".tar.gz";
  const upload = await db.storage.from(BUCKET).upload(path, bytes, {
    upsert: false, contentType: "application/gzip", cacheControl: "no-store",
  });
  if (upload.error) throw new HttpError(503, "Could not save private workspace snapshot");
  const update = await db.from("wonderspace_sandbox_workspaces").update({
    snapshot_path: path, snapshot_sha256: hash, snapshot_bytes: bytes.length,
    snapshot_version: row.snapshot_version + 1,
    last_autosave_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", row.id).eq("user_id", row.user_id)
    .eq("snapshot_version", row.snapshot_version).select("id").maybeSingle();
  if (update.error || !update.data) {
    // Do not move the pointer if a concurrent save won. An orphaned immutable
    // object may be deleted later, without risking the previously committed snapshot.
    throw new HttpError(503, "Snapshot metadata not committed; workspace stays running");
  }
}
async function createWorkspace(user, body) {
  if (!body || typeof body.name !== "string" || !NAME.test(body.name)) {
    throw new HttpError(400, "Choose a lowercase 3–32 character workspace name.");
  }
  const existing = await db.from("wonderspace_sandbox_workspaces")
    .select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if (existing.error || existing.count === null) throw new HttpError(503, "Workspace quota unavailable");
  if (existing.count >= MAX_WORKSPACES_PER_TESTER) throw new HttpError(429, "Saved workspace limit reached");
  const result = await db.from("wonderspace_sandbox_workspaces").insert({
    user_id: user.id, name: body.name,
  }).select("*").single();
  if (result.error || !result.data) throw new HttpError(409, "Workspace name unavailable");
  return publicWorkspace(result.data);
}
async function startWorkspace(user, id) {
  const row = await byOwner(user.id, id);
  if (row.state === "running" && Date.parse(row.expires_at) > Date.now() + 30000) {
    return publicWorkspace(row);
  }
  if (row.state !== "stopped") throw new HttpError(409, "Workspace is already starting or needs recovery.");
  const budget = monthlyBudget();
  const reserve = await db.rpc("reserve_wonderspace_sandbox_start", {
    p_workspace_id: id, p_user_id: user.id, p_minutes: RESERVATION_MINUTES,
    p_max_running: MAX_ACTIVE, p_monthly_minutes: budget,
  });
  if (reserve.error || reserve.data !== true) {
    throw new HttpError(429, "Workspace limit, concurrency ceiling or global reserved minutes reached.");
  }
  const nonce = randomUUID();
  const update = await db.from("wonderspace_sandbox_workspaces")
    .update({ session_nonce: nonce }).eq("id", id).eq("user_id", user.id)
    .eq("state", "starting").select("*").single();
  if (update.error || !update.data) throw new HttpError(503, "Cannot register workspace session");
  let sandbox;
  try {
    const checkpoints = await Sandbox.checkpoints();
    if (!checkpoints.some(cp => cp.key === CHECKPOINT)) throw new HttpError(503, "Clean IDE checkpoint has not been prepared");
    const checkpointPrefix = "ws-v1-" + row.id.replaceAll("-", "") + "-";
    const privateName = typeof row.last_disk_checkpoint === "string" &&
      row.last_disk_checkpoint.startsWith(checkpointPrefix) &&
      checkpoints.some(cp => cp.key === row.last_disk_checkpoint)
      ? row.last_disk_checkpoint : null;
    const deadline = Date.now() + DURATION_MINUTES * 60_000;
    const secret = deriveSecret(update.data);
    sandbox = await Sandbox.create(privateName || CHECKPOINT, {
      idleTimeoutMinutes: 15,
      networkIsolation: "PRIVATE",
      domains: [{ port: 8080 }],
      env: {
        WONDERSPACE_GATEWAY_PORT: "8080",
        WONDERSPACE_WORKSPACE_ID: row.id,
        WONDERSPACE_GATEWAY_SECRET: secret,
        WONDERSPACE_SESSION_DEADLINE_MS: String(deadline),
      },
    });
    const created = await db.from("wonderspace_sandbox_workspaces")
      .update({ sandbox_id: sandbox.id, updated_at: new Date().toISOString() })
      .eq("id", id).eq("user_id", user.id).eq("state", "starting")
      .select("*").single();
    if (created.error || !created.data) throw new HttpError(503, "Sandbox tracking unavailable");
    // A private full-disk checkpoint already contains the customer home;
    // otherwise restore the newest checksum-verified portable gzip archive.
    if (!privateName) await restoreArchive(sandbox, created.data);
    await background(sandbox, "runuser -u coder -- code-server --bind-addr 127.0.0.1:8081 --auth none --disable-telemetry --disable-update-check /home/coder/project");
    await background(sandbox, "node /opt/wonderspace/gateway.mjs");
    await checked("curl -fsS -H 'Host: probe.up.railway.app' --retry 5 --retry-delay 1 http://127.0.0.1:8080/healthz", sandbox, 25);
    const domain = domainName(sandbox);
    const running = await db.from("wonderspace_sandbox_workspaces")
      .update({ state: "running", gateway_domain: domain,
        last_disk_checkpoint: null,
        expires_at: new Date(deadline).toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id).eq("user_id", user.id).eq("state", "starting")
      .select("*").single();
    if (running.error || !running.data) throw new HttpError(503, "Sandbox readiness was not committed");
    return publicWorkspace(running.data);
  } catch (error) {
    let safelyDestroyed = !sandbox;
    if (sandbox) {
      try { await sandbox.destroy(); safelyDestroyed = true; } catch { /* retain unknown sandbox for reconciliation */ }
    }
    await db.from("wonderspace_sandbox_workspaces").update({
      state: safelyDestroyed ? "stopped" : "needs_reconciliation",
      sandbox_id: safelyDestroyed ? null : sandbox.id,
      gateway_domain: null, session_nonce: null,
      last_error_code: "startup_failed", updated_at: new Date().toISOString(),
    }).eq("id", id).eq("user_id", user.id).eq("state", "starting");
    throw error;
  }
}
async function ticket(user, id) {
  const row = await byOwner(user.id, id);
  if (row.state !== "running" || !row.gateway_domain || !row.session_nonce ||
      Date.parse(row.expires_at) <= Date.now() + 30000 ||
      !/^[a-z0-9-]+\.up\.railway\.app$/i.test(row.gateway_domain)) {
    throw new HttpError(409, "Workspace has expired or is not ready");
  }
  const now = Date.now();
  const payload = Buffer.from(JSON.stringify({
    w: row.id, id: randomUUID(), exp: now + 45_000,
  })).toString("base64url");
  const mac = createHmac("sha256", Buffer.from(deriveSecret(row), "hex"))
    .update(payload).digest("base64url");
  return { url: "https://" + row.gateway_domain + "/auth/start?ticket=" + payload + "." + mac,
    expiresAt: row.expires_at };
}
async function saveAndStop(row, reason = "user") {
  if (busy.has(row.id)) return;
  busy.add(row.id);
  try {
    const latest = await db.from("wonderspace_sandbox_workspaces")
      .select("*").eq("id", row.id).maybeSingle();
    if (latest.error || !latest.data || !latest.data.sandbox_id ||
        !["running", "saving", "needs_reconciliation"].includes(latest.data.state)) return;
    const current = latest.data;
    const mark = await db.from("wonderspace_sandbox_workspaces")
      .update({ state: "saving", updated_at: new Date().toISOString() })
      .eq("id", row.id).eq("state", current.state).select("id").maybeSingle();
    if (mark.error || !mark.data) return;
    try {
      const sandbox = await Sandbox.connect(current.sandbox_id);
      // Persist the immutable gzip blob and its SHA-256 before deleting the VM.
      await saveArchive(sandbox, current);
      // Native checkpoint retains the *entire private VM disk* (including
      // customer-installed tools, extensions and home files) for quick resume.
      // gzip remains the portable recovery source when checkpoints expire.
      let checkpointName = null;
      const prefix = "ws-v1-" + current.id.replaceAll("-", "") + "-";
      try {
        const candidate = prefix + randomBytes(8).toString("hex");
        await sandbox.checkpoint(candidate);
        checkpointName = candidate;
      } catch {
        // Checkpoint quota/storage failure must not discard a saved gzip.
      }
      const checkpointWrite = await db.from("wonderspace_sandbox_workspaces")
        .update({ last_disk_checkpoint: checkpointName })
        .eq("id", row.id).eq("state", "saving")
        .eq("sandbox_id", current.sandbox_id).select("id").maybeSingle();
      if (checkpointWrite.error || !checkpointWrite.data) {
        throw new HttpError(503, "Checkpoint state could not be committed; retaining the running VM");
      }
      await sandbox.destroy();
      const finish = await db.from("wonderspace_sandbox_workspaces").update({
        state: "stopped", sandbox_id: null, gateway_domain: null,
        session_nonce: null, expires_at: null, last_error_code: null,
        updated_at: new Date().toISOString(),
      }).eq("id", row.id).eq("state", "saving").eq("sandbox_id", current.sandbox_id)
        .select("id").maybeSingle();
      if (finish.error || !finish.data) throw new HttpError(503, "Could not verify stopped state");
      // Keep only this workspace\u0027s newest full-disk checkpoint; never prune another owner.
      try {
        const all = await Sandbox.checkpoints();
        for (const cp of all) {
          if (cp.key.startsWith(prefix) && cp.key !== checkpointName) {
            try { await Sandbox.deleteCheckpoint(cp.id); } catch { /* safe to retry later */ }
          }
        }
      } catch { /* Retain unused checkpoints rather than risk live data. */ }
    } catch {
      // Fail closed. Preserve the VM if it might still contain unsaved work,
      // and block new starts while reconciliation retries.
      await db.from("wonderspace_sandbox_workspaces").update({
        state: "needs_reconciliation", last_error_code: "save_or_destroy_failed",
        updated_at: new Date().toISOString(),
      }).eq("id", row.id).eq("state", "saving");
    }
  } finally { busy.delete(row.id); }
}
async function autosave(row) {
  if (busy.has(row.id) || row.state !== "running" ||
      (row.last_autosave_at && Date.now() - Date.parse(row.last_autosave_at) < 30000)) return;
  busy.add(row.id);
  try {
    const latest = await db.from("wonderspace_sandbox_workspaces").select("*")
      .eq("id", row.id).eq("state", "running").maybeSingle();
    if (!latest.data || latest.error || !latest.data.sandbox_id) return;
    const sandbox = await Sandbox.connect(latest.data.sandbox_id);
    await saveArchive(sandbox, latest.data);
  } catch {
    // The previous snapshot remains committed; retry on the next sweep.
  } finally { busy.delete(row.id); }
}
let sweeping = false;
async function sweep() {
  // Cleanup must continue even when public launch is disabled or paused.
  if (sweeping) return;
  sweeping = true;
  try {
    const result = await db.from("wonderspace_sandbox_workspaces").select("*")
      .in("state", ["starting", "running", "saving", "needs_reconciliation"]).limit(100);
    if (result.error || !Array.isArray(result.data)) return;
    for (const row of result.data) {
      if (row.state === "starting" && Date.parse(row.expires_at) <= Date.now()) {
        // Unknown status after interrupted allocation: cannot safely free budget.
        await db.from("wonderspace_sandbox_workspaces").update({
          state: "needs_reconciliation", last_error_code: "startup_interrupted",
        }).eq("id", row.id).eq("state", "starting");
      } else if (row.sandbox_id && row.state !== "starting") {
        if (row.state !== "running" || Date.parse(row.expires_at) < Date.now() + 60000) {
          await saveAndStop(row, "expiry");
        } else {
          await autosave(row);
        }
      }
    }
  } finally { sweeping = false; }
}
const server = http.createServer(async (req, res) => {
  if (req.url === "/healthz" && req.method === "GET") return send(res, 200, { ok: true });
  try {
    gate();
    const user = await authenticated(req);
    if (!testerIds.has(user.id)) throw new HttpError(403, "Customer sandbox access is not enabled for this account.");
    const url = new URL(req.url || "/", "http://controller.internal");
    if (url.pathname === "/v1/workspaces" && req.method === "GET") {
      const list = await db.from("wonderspace_sandbox_workspaces").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: true });
      if (list.error) throw new HttpError(503, "Workspace inventory unavailable");
      return send(res, 200, { workspaces: (list.data || []).map(publicWorkspace) });
    }
    if (url.pathname === "/v1/workspaces" && req.method === "POST") {
      return send(res, 201, { workspace: await createWorkspace(user, await input(req)) });
    }
    const match = /^\/v1\/workspaces\/([a-f0-9-]{36})(?:\/(start|stop|ticket))?$/.exec(url.pathname);
    if (!match) throw new HttpError(404, "Unknown endpoint");
    const [, id, action] = match;
    if (!action && req.method === "GET") {
      return send(res, 200, { workspace: publicWorkspace(await byOwner(user.id, id)) });
    }
    if (action === "start" && req.method === "POST") {
      return send(res, 200, { workspace: await startWorkspace(user, id) });
    }
    if (action === "ticket" && req.method === "POST") {
      return send(res, 200, await ticket(user, id));
    }
    if (action === "stop" && req.method === "POST") {
      const row = await byOwner(user.id, id);
      if (row.state !== "running") throw new HttpError(409, "Workspace is not running");
      await saveAndStop(row);
      const current = await byOwner(user.id, id);
      if (current.state !== "stopped") throw new HttpError(503, "Save or stop needs reconciliation");
      return send(res, 200, { workspace: publicWorkspace(current) });
    }
    throw new HttpError(405, "Unsupported operation");
  } catch (cause) {
    const status = cause instanceof HttpError ? cause.status : 503;
    const error = cause instanceof HttpError ? cause.message : "Sandbox controller temporarily unavailable";
    return send(res, status, { error });
  }
});
const port = Number(process.env.PORT || "8080");
server.listen(port, "0.0.0.0");
setInterval(() => { void sweep().catch(() => {}); }, 15000).unref();
void sweep().catch(() => {});
