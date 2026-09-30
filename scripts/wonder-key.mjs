#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import process from "node:process";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

for (const candidate of [
  ".env.local",
  ".env",
  "apps/web/.env.local",
  "apps/web/.env",
]) {
  loadEnvFile(path.resolve(process.cwd(), candidate));
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function command() {
  const value = process.argv[2];
  return value && !value.startsWith("-") ? value : "create";
}

async function promptText(label, fallback = "") {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(fallback ? `${label} [${fallback}]: ` : `${label}: `)).trim() || fallback;
  } finally {
    rl.close();
  }
}

async function promptHidden(label) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new Error("Interactive password entry requires a TTY");
  }
  process.stdout.write(`${label}: `);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  return await new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Cancelled"));
          return;
        }
        if (char === "\r" || char === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (char === "\u007f") {
          value = value.slice(0, -1);
          continue;
        }
        if (char >= " ") value += char;
      }
    };
    process.stdin.on("data", onData);
  });
}

async function main() {
  const baseUrl = (arg("--url") || process.env.DREAMMAKERHUB_URL || "https://dreammakerhub.website").replace(/\/$/, "");

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  let publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !publishableKey) {
    const configResponse = await fetch(`${baseUrl}/api/auth/config`, {
      headers: { Accept: "application/json" },
    });
    const config = await configResponse.json().catch(() => ({}));
    if (configResponse.ok) {
      supabaseUrl ||= config.supabaseUrl;
      publishableKey ||= config.publishableKey;
    }
  }

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "DreamMakerHub public auth configuration is unavailable. Deploy the current Master or provide NEXT_PUBLIC_SUPABASE_URL and a publishable/anon key locally.",
    );
  }
  const email = arg("--email") || process.env.DREAMMAKERHUB_EMAIL || await promptText("DreamMakerHub email");
  const password = process.env.DREAMMAKERHUB_PASSWORD || await promptHidden("DreamMakerHub password");

  const authResponse = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: publishableKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    },
  );
  const authBody = await authResponse.json().catch(() => ({}));
  if (!authResponse.ok || !authBody?.access_token) {
    throw new Error(authBody?.msg || authBody?.error_description || authBody?.error || "DreamMakerHub sign-in failed");
  }

  const headers = {
    Authorization: `Bearer ${authBody.access_token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const action = command();
  if (action === "create") {
    const name = arg("--name") || await promptText("Key name", "CLI key");
    const response = await fetch(`${baseUrl}/api/keys`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Key creation failed (${response.status})`);

    process.stdout.write("\nWonderland API key created. Copy it now; it will not be shown again.\n\n");
    process.stdout.write(`${body.token}\n\n`);
    process.stdout.write(`Name: ${body.key?.name || name}\n`);
    process.stdout.write(`ID:   ${body.key?.id || "unknown"}\n`);
    return;
  }

  if (action === "list") {
    const response = await fetch(`${baseUrl}/api/keys`, { headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Key listing failed (${response.status})`);
    const keys = Array.isArray(body.keys) ? body.keys : [];
    if (!keys.length) {
      process.stdout.write("No API keys found.\n");
      return;
    }
    for (const key of keys) {
      process.stdout.write(`${key.id}  ${key.name}  ${key.prefix}  ${key.revoked_at ? "revoked" : "active"}\n`);
    }
    return;
  }

  if (action === "revoke") {
    const id = arg("--id");
    if (!id) throw new Error("revoke requires --id <key-id>");
    const response = await fetch(`${baseUrl}/api/keys/api`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Key revocation failed (${response.status})`);
    process.stdout.write(`Revoked ${id}\n`);
    return;
  }

  throw new Error("Usage: npm run wonder:key -- create|list|revoke [--name NAME] [--id UUID] [--url URL] [--email EMAIL]");
}

main().catch((error) => {
  process.stderr.write(`wonder:key: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
