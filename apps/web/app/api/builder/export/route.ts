import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { sanitizeUntrustedHtml } from "@/lib/security/sanitize-html.server";
import { logger } from "@/lib/logger";

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_CSS_LENGTH = 500_000;

const escapeTemplateLiteral = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");

const escapeHtmlText = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toComponentName = (value: string) => {
  const base = value
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join("");

  const safeBase = base || "WonderBuildPage";
  return /^[0-9]/.test(safeBase) ? `Page${safeBase}` : safeBase;
};

type ExportPayload = {
  html?: unknown;
  css?: unknown;
  title?: unknown;
};

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const declaredLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Export payload too large" }, { status: 413 });
  }

  try {
    const raw = await req.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Export payload too large" }, { status: 413 });
    }

    const payload = JSON.parse(raw) as ExportPayload;
    const rawHtml = typeof payload.html === "string" ? payload.html : "";
    if (!rawHtml.trim()) {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
    }

    const safeHtml = sanitizeUntrustedHtml(rawHtml);
    const safeTitle = typeof payload.title === "string"
      ? payload.title.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 160) || "Wonder Build"
      : "Wonder Build";
    const safeTitleHtml = escapeHtmlText(safeTitle);
    const componentName = toComponentName(safeTitle);
    const pageMarkup = escapeTemplateLiteral(safeHtml);
    const styleCss = typeof payload.css === "string" ? payload.css.slice(0, MAX_CSS_LENGTH) : "";

    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' https: data: blob:; script-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none';" />
    <title>${safeTitleHtml}</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    ${safeHtml}
  </body>
</html>`;

    const pageTsx = `import React from "react";
import "./style.css";

const markup = \`${pageMarkup}\`;

export default function ${componentName}() {
  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}
`;

    return NextResponse.json({
      files: {
        "index.html": indexHtml,
        "style.css": styleCss,
        "Page.tsx": pageTsx,
      },
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    logger.error("Failed to export builder bundle", error);
    return NextResponse.json({ error: "Failed to export builder bundle" }, { status: 500 });
  }
}
