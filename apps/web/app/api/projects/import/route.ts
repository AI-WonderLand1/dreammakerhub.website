import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { createProject, updateProjectMetadata, writeFile, storage } from "@/lib/projects/storage";
import { getSmokeUserIdFromRequest } from "@/lib/smokeAuth";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

function normalizePath(p: string) {
  const normalized = path.normalize(p).replace(/^(\.\/|\/)+/, "");
  if (normalized.startsWith("..")) return null;
  return normalized;
}


const TEXT_FILE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".md", ".txt", ".css", ".scss", ".sass",
  ".html", ".htm", ".xml", ".yml", ".yaml", ".env",
  ".sh", ".py", ".java", ".go", ".rs", ".php", ".rb",
  ".sql", ".graphql", ".gql", ".toml", ".ini", ".conf",
]);

function shouldTreatAsText(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_FILE_EXTENSIONS.has(ext);
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ownerId = smokeUserId ?? user!.id;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "import-"));

  try {
    const zipPath = path.join(tmp, "upload.zip");
    await fs.writeFile(zipPath, Buffer.from(await file.arrayBuffer()));
    const extractDir = path.join(tmp, "extracted");
    await fs.mkdir(extractDir, { recursive: true });
   
    const script = `
import zipfile, sys, os
import { logger } from '@/lib/logger';

src = sys.argv[1]
dst = sys.argv[2]

def is_safe(name):
    n = os.path.normpath(name)
    if n.startswith("..") or n.startswith("/") or n.startswith("\\"):
        return False
    return True

with zipfile.ZipFile(src, 'r') as z:
    for m in z.namelist():
        if not is_safe(m):
            raise Exception("Unsafe zip entry: " + m)
    z.extractall(dst)
`;

    await execFileAsync("python3", ["-c", script, zipPath, extractDir]);

    const project = await createProject(
      ownerId,
      file.name.replace(/\.zip$/i, "") || "Imported Project"
    );

    const { error: projectInsertError } = await supabase
      .from("projects")
      .upsert(
        [
          {
            id: project.id,
            name: project.name,
            tool: project.tool ?? "wonder-build",
            owner_id: ownerId,
          },
        ],
        { onConflict: "id" }
      );
    if (projectInsertError) {
      throw projectInsertError;
    }

    let importedMeta: any = null;
    let importedFiles = 0;
    let importedBinaryFiles = 0;
    let skippedBinaryFiles = 0;

    const walker = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        const rel = path.relative(extractDir, full);
        const safe = normalizePath(rel);
        if (!safe) continue;
        if (entry.isDirectory()) {
          await walker(full);
          continue;
        }
        const buf = await fs.readFile(full);
        if (safe === "wonderbuild.json") {
          const content = buf.toString("utf8");
          await writeFile(project.id, ownerId, "wonderbuild.json", content);
          importedFiles += 1;
          try {
            importedMeta = JSON.parse(content);
          } catch(e) {
            logger.warn("could not parse wonderbuild.json", e);
          }
        } else if (safe.startsWith("files/")) {
          const relFile = safe.replace(/^files\//, "");
          await writeFile(project.id, ownerId, relFile, buf.toString("utf8"));
          importedFiles += 1;
        } else if (safe.startsWith("snapshots/")) {
          await storage.upload(`projects/${project.id}/${safe}`, buf);
          importedFiles += 1;
        } else if (shouldTreatAsText(safe)) {
          await writeFile(project.id, ownerId, safe, buf.toString("utf8"));
          importedFiles += 1;
        } else {
          try {
            await storage.upload(`projects/${project.id}/assets/${safe}`, buf);
            importedBinaryFiles += 1;
          } catch {
            skippedBinaryFiles += 1;
          }
        }
      }
    };

    await walker(extractDir);
    await updateProjectMetadata(project.id, ownerId, {
      name: importedMeta?.name || project.name,
      tool: importedMeta?.tool || project.tool,
    });
    
    return NextResponse.json({ ok: true, projectId: project.id, importedFiles, importedBinaryFiles, skippedBinaryFiles });
  } catch (error: any) {
    logger.error("Failed to import project", error);
    return NextResponse.json({ error: "Failed to import project" }, { status: 500 });
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}
