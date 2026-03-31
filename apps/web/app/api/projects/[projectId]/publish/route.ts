import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatch";
import {
  listFiles,
  readFile,
  updateProjectMetadata,
  getProjectMetadata,
} from "@lib/projects/storage";

export const runtime = "nodejs";

const BUCKET = "published";

/**
 * Very simple WonderBuild -> HTML renderer fallback
 * Used only if index.html is missing.
 */
function renderWonderbuild(json: any) {
  const blocks = Array.isArray(json?.blocks) ? json.blocks : [];
  const body = blocks
    .map((block: any) => {
      if (block.type === "text") {
        return `<p style="color:${block.color ?? "#fff"};text-align:${block.align ?? "left"};font-size:${block.size ?? 16}px;">${
          block.text ?? ""
        }</p>`;
      }
      if (block.type === "image") {
        return `<img src="${block.src ?? ""}" alt="${block.alt ?? ""}" style="max-width:100%;" />`;
      }
      if (block.type === "button") {
        return `<a href="${block.href ?? "#"}" style="display:inline-block;padding:12px 18px;background:${block.bgColor ?? "#a855f7"};color:${block.color ?? "#000"};border-radius:12px;text-decoration:none;">${
          block.text ?? "Click"
        }</a>`;
      }
      if (block.type === "video") {
        return `<video src="${block.src ?? ""}" controls style="max-width:100%;"></video>`;
      }
      return "";
    })
    .join("\n");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Published</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #0b0b10;
      color: #f8fafc;
      padding: 32px;
      max-width: 900px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

/**
 * Prevent path traversal and weird storage keys
 */
function safeRelPath(p: string) {
  let s = String(p || "").replace(/^\/+/, "");
  if (!s) s = "index.html";
  if (s.includes("..")) throw new Error("Invalid path");
  if (s.includes("\\")) throw new Error("Invalid path");
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(s)) throw new Error("Invalid path");
  return s;
}

/**
 * Normalize any data from your project storage into Buffer for upload.
 */
function toBuffer(content: any): Buffer {
  if (content == null) return Buffer.from("");
  if (Buffer.isBuffer(content)) return content;
  if (typeof content === "string") return Buffer.from(content, "utf8");
  if (content instanceof Uint8Array) return Buffer.from(content);
  if (content instanceof ArrayBuffer) return Buffer.from(new Uint8Array(content));
  // last resort
  return Buffer.from(String(content), "utf8");
}

function toText(content: any): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (Buffer.isBuffer(content)) return content.toString("utf8");
  if (content instanceof Uint8Array) return Buffer.from(content).toString("utf8");
  if (content instanceof ArrayBuffer) return Buffer.from(new Uint8Array(content)).toString("utf8");
  return String(content);
}

/**
 * Basic content-type mapping so published assets render correctly.
 */
function guessContentType(path: string) {
  const p = path.toLowerCase();
  if (p.endsWith(".html")) return "text/html; charset=utf-8";
  if (p.endsWith(".css")) return "text/css; charset=utf-8";
  if (p.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (p.endsWith(".json")) return "application/json; charset=utf-8";
  if (p.endsWith(".svg")) return "image/svg+xml";
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  if (p.endsWith(".webp")) return "image/webp";
  if (p.endsWith(".gif")) return "image/gif";
  if (p.endsWith(".ico")) return "image/x-icon";
  if (p.endsWith(".woff")) return "font/woff";
  if (p.endsWith(".woff2")) return "font/woff2";
  if (p.endsWith(".ttf")) return "font/ttf";
  if (p.endsWith(".mp4")) return "video/mp4";
  return "application/octet-stream";
}

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const traceId = randomUUID();

  try {
    // ---------- AUTH ----------
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const smokeUserId = getSmokeUserIdFromRequest(req);
    const ownerId = smokeUserId ?? user?.id;

    if (!ownerId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", traceId },
        { status: 401 }
      );
    }

    // ---------- ENTITLEMENT ----------
    const meta = await getProjectMetadata(params.projectId, ownerId);
    if (!meta?.publishEnabled) {
      return NextResponse.json(
        { ok: false, error: "Upgrade required to publish", traceId },
        { status: 403 }
      );
    }

    // ---------- PUBLISH ----------
    const publishId = randomUUID();
    const files = await listFiles(params.projectId, ownerId);

    // quick bucket sanity check (clean error if missing)
    // We attempt a harmless operation: list objects under a never-used prefix.
    const bucketCheck = await supabase.storage.from(BUCKET).list("__bucket_check__", { limit: 1 });
    if (bucketCheck?.error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Storage bucket "${BUCKET}" not found or not accessible. ` +
            `Create it in Supabase Storage (public recommended). ` +
            `Details: ${bucketCheck.error.message}`,
          traceId,
        },
        { status: 500 }
      );
    }

    for (const file of files) {
      const rel = safeRelPath(file);
      const raw = await readFile(params.projectId, ownerId, rel);
      if (raw == null) continue;

      const key = `${params.projectId}/${publishId}/${rel}`;
      const body = toBuffer(raw);

      const { error } = await supabase.storage.from(BUCKET).upload(key, body, {
        upsert: true,
        contentType: guessContentType(rel),
      });

      if (error) throw new Error(error.message);
    }

    // ---------- ENSURE index.html ----------
    const indexKey = `${params.projectId}/${publishId}/index.html`;

    // If index.html wasn't among files, create one
    const indexExists = files.some((f) => safeRelPath(f) === "index.html");
    if (!indexExists) {
      const wbRaw = await readFile(params.projectId, ownerId, "wonderbuild.json");
      const wbText = toText(wbRaw);

      let html = "<!doctype html><html><body><h1>Published</h1></body></html>";
      if (wbText) {
        try {
          html = renderWonderbuild(JSON.parse(wbText));
        } catch {
          // fallback stays default
        }
      }

      const { error } = await supabase.storage.from(BUCKET).upload(indexKey, toBuffer(html), {
        upsert: true,
        contentType: "text/html; charset=utf-8",
      });

      if (error) throw new Error(error.message);
    }

    // ---------- UPDATE METADATA ----------
    await updateProjectMetadata(params.projectId, ownerId, {
      lastPublishId: publishId,
    });

    const url = `${req.nextUrl.origin}/published/${params.projectId}/${publishId}`;

    const webhooks = await dispatchWebhookEvent({
      ownerId,
      event: "project.exported",
      projectId: params.projectId,
      data: { publishId, url },
    });

    return NextResponse.json({ ok: true, publishId, url, webhooks, traceId });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Publish failed", traceId },
      { status: 500 }
    );
  }
}
