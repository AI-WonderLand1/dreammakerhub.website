import { NextRequest, NextResponse } from "next/server";
import { requirePaidAIUser } from "@/app/api/ai/auth";
import { getProjectMetadata, readFile, writeFile } from "@/lib/projects/storage";
import { logger } from "@/lib/logger";

type Context = { params: Promise<{ projectId: string }> };
const WIKI_PATH = ".wonderspace/wiki/home.md";
const noStore = { "Cache-Control": "private, no-store" };
const respond = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (message === "Project metadata missing") return NextResponse.json({ error: "Project not found" }, { status: 404 });
  logger.error("[wonderspace/wiki] operation failed", error);
  return NextResponse.json({ error: "Unable to access project wiki" }, { status: 500 });
};
export async function GET(req: NextRequest, { params }: Context) {
  const auth = await requirePaidAIUser(req);
  if (!("userId" in auth)) return auth as NextResponse;
  try {
    const { projectId } = await params;
    await getProjectMetadata(projectId, auth.userId);
    const content = await readFile(projectId, auth.userId, WIKI_PATH);
    return NextResponse.json({ content: content ?? "", exists: content !== null }, { headers: noStore });
  } catch (error) { return respond(error); }
}
export async function PUT(req: NextRequest, { params }: Context) {
  const auth = await requirePaidAIUser(req);
  if (!("userId" in auth)) return auth as NextResponse;
  const input: unknown = await req.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      typeof (input as { content?: unknown }).content !== "string" ||
      (input as { content: string }).content.length > 30000) {
    return NextResponse.json({ error: "Wiki must contain no more than 30000 characters of Markdown" }, { status: 400 });
  }
  try {
    const { projectId } = await params;
    await writeFile(projectId, auth.userId, WIKI_PATH, (input as { content: string }).content);
    return NextResponse.json({ saved: true, savedAt: new Date().toISOString() }, { headers: noStore });
  } catch (error) { return respond(error); }
}
