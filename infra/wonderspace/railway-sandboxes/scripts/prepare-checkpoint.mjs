import { Sandbox } from "railway";
import { readFile } from "node:fs/promises";

// Run only with the owner's explicit approval. This creates billable VM compute.
// Never checkpoint a live operator home directory: it may contain credentials.
if (process.env.CONFIRM_BILLABLE_SANDBOX_TEST !== "YES") {
  throw new Error("Set CONFIRM_BILLABLE_SANDBOX_TEST=YES after approving Railway sandbox charges.");
}
if (!process.env.RAILWAY_API_TOKEN || !process.env.RAILWAY_ENVIRONMENT_ID) {
  throw new Error("Set Railway credentials privately in the execution environment.");
}

const CHECKPOINT = "wonderspace-clean-v1";
const existing = await Sandbox.checkpoints();
if (existing.some((item) => item.key === CHECKPOINT)) {
  console.log("Clean WonderSpace checkpoint already exists; leaving it unchanged.");
  process.exit(0);
}

// Reproduce only IDE software, never the operator's current files, secrets or settings.
// A prepared sandbox checkpoint can seed independent customer VMs on demand.
const template = Sandbox.template()
  .withPackages("git", "gzip", "tar", "curl", "ca-certificates")
  .run("npm install --global code-server@4.130.0")
  .run("install -d /opt/wonderspace && npm install --prefix /opt/wonderspace --no-audit --no-fund http-proxy@1.18.1");

let base;
try {
  base = await Sandbox.create(template, {
    idleTimeoutMinutes: 5,
    region: "us-east4-eqdc4a",
    networkIsolation: "ISOLATED",
  });

  await base.files.write("/opt/wonderspace/gateway.mjs", await readFile(new URL("../gateway.mjs", import.meta.url), "utf8"), { mode: 0o644 });

  const setup = await base.exec(
    "set -eu; (id coder >/dev/null 2>&1 || useradd -m -s /bin/bash coder); " +
    "install -d -m 0750 -o coder -g coder /home/coder/project; " +
    "code-server --version; node --check /opt/wonderspace/gateway.mjs; " +
    "test -d /home/coder/project; " +
    "test ! -e /home/coder/.ssh; " +
    "test ! -e /home/coder/.config/code-server/config.yaml; " +
    "test ! -e /home/coder/project/.env",
    { timeoutSec: 60 },
  );
  if (setup.exitCode !== 0) {
    throw new Error("Refusing to checkpoint failed or unsafe base setup: " + setup.stderr);
  }
  await base.checkpoint(CHECKPOINT);
  console.log("Prepared clean checkpoint:", CHECKPOINT);
} finally {
  if (base) await base.destroy();
}
