import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { requirePaidAIUser } from "@/app/api/ai/auth";
import { logger } from "@/lib/logger";
import {
  captureSourceVersion, listSourceVersions, loadSourceVersion,
  readCurrentProjectSourceFiles,
} from "@/lib/projects/storage";

type Context = { params: Promise<{ projectId: string }> };
const noStore = { "Cache-Control": "private, no-store" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(error: unknown): NextResponse {
  const reason = error instanceof Error ? error.message : "";
  if (reason === "Forbidden" || reason === "Project metadata missing" ||
      reason === "SOURCE_VERSION_NOT_FOUND") {
    // Do not confirm another owner's project exists.
    return NextResponse.json({ error: "Project or version not found" }, { status: 404, headers: noStore });
  }
  if (reason === "SOURCE_HISTORY_LIMIT") {
    return NextResponse.json({
      error: "Version history is full (50). Export your versions before continuing.",
    }, { status: 409, headers: noStore });
  }
  if (reason === "SOURCE_COMPARE_TOO_LARGE") {
    return NextResponse.json({
      error: "Too many working-tree files to compare; download this version instead.",
    }, { status: 413, headers: noStore });
  }
  if (reason === "SOURCE_CHECKPOINT_TOO_LARGE") {
    return NextResponse.json({
      error: "This initial text-code history supports up to 200 files, 256 KB per file and 1 MB total.",
    }, { status: 413, headers: noStore });
  }
  if (reason === "SOURCE_INVALID_TITLE") {
    return NextResponse.json({ error: "Enter a short version name." }, { status: 400, headers: noStore });
  }
  logger.error("WonderSpace source history unavailable", error);
  return NextResponse.json({ error: "Source history is temporarily unavailable." },
    { status: 503, headers: noStore });
}

export async function GET(req: NextRequest, { params }: Context) {
  const auth = await requirePaidAIUser(req);
  if (!("userId" in auth)) return auth as NextResponse;
  const { projectId } = await params;
  const versionId = req.nextUrl.searchParams.get("versionId");
  const format = req.nextUrl.searchParams.get("format");

  if (format && format !== "zip") {
    return NextResponse.json({ error: "Unsupported format" }, { status: 400, headers: noStore });
  }
  if (format && !versionId) {
    return NextResponse.json({ error: "Choose a version first" }, { status: 400, headers: noStore });
  }
  if (versionId && !uuid.test(versionId)) {
    return NextResponse.json({ error: "Invalid version ID" }, { status: 400, headers: noStore });
  }

  try {
    if (!versionId) {
      const versions = await listSourceVersions(projectId, auth.userId);
      return NextResponse.json({ versions, limit: 50 }, { headers: noStore });
    }
    const version = await loadSourceVersion(projectId, auth.userId, versionId);

    if (format === "zip") {
      const zip = new JSZip();
      for (const [path, content] of Object.entries(version.files)) {
        // loadSourceVersion validates all paths before archive construction.
        zip.file(path, content);
      }
      const bytes = await zip.generateAsync({
        type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 },
      });
      return new NextResponse(new Uint8Array(bytes), {
        status: 200, headers: {
          ...noStore, "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="wonderspace-version-${version.versionNumber}.zip"`,
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const current = await readCurrentProjectSourceFiles(projectId, auth.userId);
    const saved = version.files;
    const savedKeys = Object.keys(saved);
    const currentKeys = Object.keys(current);
    const added = currentKeys.filter(path => !(path in saved)).sort();
    const deleted = savedKeys.filter(path => !(path in current)).sort();
    const modified = currentKeys.filter(path => path in saved && current[path] !== saved[path]).sort();
    return NextResponse.json({
      version: {
        id: version.id, title: version.title,
        versionNumber: version.versionNumber, createdAt: version.createdAt,
      },
      changes: { added, deleted, modified },
      unchanged: currentKeys.filter(path => path in saved && current[path] === saved[path]).length,
    }, { headers: noStore });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest, { params }: Context) {
  const auth = await requirePaidAIUser(req);
  if (!("userId" in auth)) return auth as NextResponse;
  const size = Number(req.headers.get("content-length") ?? 0);
  if (!Number.isFinite(size) || size > 1024) {
    return NextResponse.json({ error: "Version name is too long." }, { status: 413, headers: noStore });
  }
  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: noStore });
  }
  const input = body as Record<string, unknown>;
  if (input.title !== undefined && typeof input.title !== "string") {
    return NextResponse.json({ error: "Invalid version name" }, { status: 400, headers: noStore });
  }
  const title = typeof input.title === "string" ? input.title.trim() : "Checkpoint";
  if (!title || title.length > 100) {
    return NextResponse.json({ error: "Version name must be 1–100 characters" },
      { status: 400, headers: noStore });
  }

  try {
    const { projectId } = await params;
    const version = await captureSourceVersion(projectId, auth.userId, title);
    return NextResponse.json({ version }, { status: 201, headers: noStore });
  } catch (error) {
    return fail(error);
  }
}
