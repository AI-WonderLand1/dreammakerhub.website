import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Sandbox } from "railway";

// Smoke test only: two sequential, private sandboxes; no IDE publicly exposed.
// Do NOT run against a customer's files or the owner's existing IDE volume.
if (process.env.CONFIRM_BILLABLE_SANDBOX_TEST !== "YES") {
  throw new Error("Set CONFIRM_BILLABLE_SANDBOX_TEST=YES only after approving Railway usage.");
}
if (!process.env.RAILWAY_API_TOKEN || !process.env.RAILWAY_ENVIRONMENT_ID) {
  throw new Error("Railway credentials must be set privately in the execution environment.");
}

const CHECKPOINT = "wonderspace-clean-v1";
const checkpoints = await Sandbox.checkpoints();
if (!checkpoints.some((item) => item.key === CHECKPOINT)) {
  throw new Error("Prepare the clean checkpoint first with npm run prepare:checkpoint.");
}

const id = randomUUID();
const expected = "independent-project-" + id + "\n";
const projectFile = "/home/coder/project/snapshot-smoke.txt";
const archivePath = "/tmp/wonderspace-save.tar.gz";
let first;
let archive;
try {
  first = await Sandbox.create(CHECKPOINT, {
    idleTimeoutMinutes: 5,
    networkIsolation: "ISOLATED",
  });
  await first.files.write(projectFile, expected);
  const pack = await first.exec(
    "runuser -u coder -- python3 /opt/wonderspace/export.py",
    { timeoutSec: 30 },
  );
  assert.equal(pack.exitCode, 0, pack.stderr);
  archive = await first.files.read(archivePath, { format: "bytes" });
  assert.ok(archive.byteLength > 0, "Expected nonempty gzip file");
} finally {
  if (first) await first.destroy();
}

// In production this versioned gzip archive belongs in the authenticated
// customer's PRIVATE Supabase Storage path; never in a public bucket.
const digest = createHash("sha256").update(archive).digest("hex");
await mkdir("snapshots", { recursive: true, mode: 0o700 });
const filename = join("snapshots", "snapshot-smoke-" + id + ".tar.gz");
await writeFile(filename, archive, { mode: 0o600 });

let resumed;
try {
  resumed = await Sandbox.create(CHECKPOINT, {
    idleTimeoutMinutes: 5,
    networkIsolation: "ISOLATED",
  });
  await resumed.files.write("/tmp/wonderspace-restore.tar.gz", archive);
  const inspect = await resumed.exec(
    "runuser -u coder -- python3 /opt/wonderspace/restore.py",
    { timeoutSec: 30 },
  );
  assert.equal(inspect.exitCode, 0, inspect.stderr);
  assert.equal(await resumed.files.read(projectFile), expected);
  console.log("PASS: clean checkpoint -> private VM -> gzip -> destroy -> new private VM -> restore");
  console.log("Smoke archive:", filename);
  console.log("SHA-256:", digest);
} finally {
  if (resumed) await resumed.destroy();
}
