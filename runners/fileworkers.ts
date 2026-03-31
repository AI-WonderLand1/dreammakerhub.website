// workers/fileWorker.ts
import "server-only";
import fs from "fs/promises";
import path from "path";

export type WriteFilePayload = {
  path: string;
  content: string;
};

const WORKSPACE_ROOT = path.resolve(process.cwd());
const ROOT_WITH_SEPARATOR = WORKSPACE_ROOT.endsWith(path.sep)
  ? WORKSPACE_ROOT
  : `${WORKSPACE_ROOT}${path.sep}`;

function ensureValidPath(targetPath: string) {
  if (!targetPath) {
    throw new Error("A file path is required.");
  }

  const resolved = path.resolve(WORKSPACE_ROOT, targetPath);

  if (resolved !== WORKSPACE_ROOT && !resolved.startsWith(ROOT_WITH_SEPARATOR)) {
    throw new Error(`Refusing to write outside the workspace: ${targetPath}`);
  }

  return resolved;
}

export async function writeFiles(files: WriteFilePayload[]) {
  const written: string[] = [];

  for (const file of files) {
    if (!file || typeof file.path !== "string" || typeof file.content !== "string") {
      throw new Error("Each file entry must include a string path and content.");
    }

    const fullPath = ensureValidPath(file.path);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.content, "utf8");

    written.push(file.path);
  }

  return { ok: true, written };
}
