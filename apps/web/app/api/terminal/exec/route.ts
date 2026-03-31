import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { createClient } from "@/app/utils/supabase/server";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";

const DATA_ROOT = path.join(process.cwd(), ".data", "projects");

// ✅ Kill RCE: only allow non-execution commands
const ALLOWED = new Set(["ls", "cat", "pwd"]);

// Adjust this if your project IDs are UUIDs or use a different format
function assertValidProjectId(projectId: string) {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(projectId)) {
    throw new Error("Invalid projectId");
  }
}

function projectFilesPath(projectId: string) {
  // projectId validated before calling this
  return path.join(DATA_ROOT, projectId, "files");
}

async function readMetadata(projectId: string) {
  const metaPath = path.join(DATA_ROOT, projectId, "metadata.json");
  const raw = await fs.readFile(metaPath, "utf8");
  return JSON.parse(raw) as { ownerId: string };
}

async function assertOwner(projectId: string, ownerId: string) {
  const meta = await readMetadata(projectId);
  if (meta.ownerId !== ownerId) throw new Error("Forbidden");
}

// ✅ Correct sandbox boundary check (no prefix bypass)
function sanitizePath(cwd: string, target: string) {
  const resolved = path.resolve(cwd, target);
  const rel = path.relative(cwd, resolved);
  // If rel starts with ".." then resolved is outside cwd
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("Invalid path");
  }
  return resolved;
}

async function handleLs(cwd: string, args: string[]) {
  const dir = args[0] ? sanitizePath(cwd, args[0]) : cwd;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.map((e) => `${e.isDirectory() ? "d" : "-"} ${e.name}`).join("\n");
}

async function handleCat(cwd: string, args: string[]) {
  if (!args[0]) throw new Error("cat requires a file path");
  const filePath = sanitizePath(cwd, args[0]);
  return await fs.readFile(filePath, "utf8");
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const traceId = randomUUID();

  try {
    // --- Auth (real check happens here, not middleware) ---
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const smokeUserId = getSmokeUserIdFromRequest(req);

    const principalId = smokeUserId ?? user?.id;
    if (!principalId) {
      return NextResponse.json(
        { error: { message: "Unauthorized", code: "unauthorized" }, traceId },
        { status: 401 }
      );
    }

    // --- Input validation ---
    const body = await req.json().catch(() => null);
    const projectId = typeof body?.projectId === "string" ? body.projectId : null;
    const command = typeof body?.command === "string" ? body.command.trim() : "";

    if (!projectId || !command) {
      return NextResponse.json(
        { error: { message: "projectId and command required", code: "bad_request" }, traceId },
        { status: 400 }
      );
    }

    // ✅ Prevent path injection via projectId
    assertValidProjectId(projectId);

    const cwd = projectFilesPath(projectId);

    // Ownership gate
    await assertOwner(projectId, principalId);

    // Parse command
    const parts = command.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    if (!ALLOWED.has(cmd)) {
      return NextResponse.json(
        { error: { message: "Command not allowed", code: "forbidden" }, traceId },
        { status: 403 }
      );
    }

    // Execute allowed "safe" operations only
    let result = "";
    if (cmd === "ls") {
      result = await handleLs(cwd, args);
    } else if (cmd === "cat") {
      result = await handleCat(cwd, args);
    } else if (cmd === "pwd") {
      result = cwd;
    } else {
      // Should be unreachable because of ALLOWED set
      return NextResponse.json(
        { error: { message: "Command not allowed", code: "forbidden" }, traceId },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, result, traceId });
  } catch (error: any) {
    // Avoid leaking internals; keep traceId for debugging
    const msg = String(error?.message || "");
    const status =
      msg === "Forbidden" ? 403 :
      msg === "Invalid projectId" ? 400 :
      msg === "Invalid path" ? 400 :
      500;

    const safeMessage =
      status === 500 ? "Execution failed" : msg;

    return NextResponse.json(
      { error: { message: safeMessage, code: "exec_error" }, traceId },
      { status }
    );
  }
}
