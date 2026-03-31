import { NextRequest, NextResponse } from "next/server";

const escapeTemplateLiteral = (value: string) =>
  value.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const toComponentName = (value: string) => {
  const base = value
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join("");

  return base || "WonderBuildPage";
};

type ExportPayload = {
  html?: string;
  css?: string;
  title?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { html, css, title }: ExportPayload = await req.json();

    if (!html) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    const safeTitle = title?.trim() || "Wonder Build";
    const componentName = toComponentName(safeTitle);
    const pageMarkup = escapeTemplateLiteral(html);

    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    ${html}
  </body>
</html>`;

    const styleCss = css ?? "";

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
    });
  } catch (error) {
    console.error("Failed to export builder bundle", error);
    return NextResponse.json(
      { error: "Failed to export builder bundle" },
      { status: 500 }
    );
  }
}
