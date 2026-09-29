import { NextRequest, NextResponse } from "next/server";
import { requirePaidAIUser } from "@/app/api/ai/auth";
import {
  createWorkItem, isWorkItemKind, listWorkItems, updateWorkItem,
  validateItemText,
} from "@/lib/wonderspace/project-work-items.server";
import { logger } from "@/lib/logger";

type Context = { params: Promise<{ projectId: string }> };
const noStore = { "Cache-Control": "private, no-store" };

function fail(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (message === "Project metadata missing" || message === "ITEM_NOT_FOUND") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (message.startsWith("INVALID_")) return NextResponse.json({ error: "Invalid item input" }, { status: 400 });
  if (message === "WORK_ITEM_LIMIT_REACHED") {
    return NextResponse.json({ error: "Project item limit reached" }, { status: 409 });
  }
  logger.error("[wonderspace/work-items] operation failed", error);
  return NextResponse.json({ error: "Unable to access project items" }, { status: 500 });
}

export async function GET(req: NextRequest, { params }: Context) {
  const auth = await requirePaidAIUser(req);
  if (!("userId" in auth)) return auth as NextResponse;
  const kind = req.nextUrl.searchParams.get("kind");
  if (!isWorkItemKind(kind)) return NextResponse.json({ error: "kind must be issue or discussion" }, { status: 400 });
  try {
    const { projectId } = await params;
    const items = await listWorkItems(projectId, auth.userId, kind);
    return NextResponse.json({ items, projectId, kind }, { headers: noStore });
  } catch (error) { return fail(error); }
}

export async function POST(req: NextRequest, { params }: Context) {
  const auth = await requirePaidAIUser(req);
  if (!("userId" in auth)) return auth as NextResponse;
  const input: unknown = await req.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const body = input as Record<string, unknown>;
  if (!isWorkItemKind(body.kind)) return NextResponse.json({ error: "kind must be issue or discussion" }, { status: 400 });
  const text = validateItemText(body.title, body.body);
  if (!text) return NextResponse.json({ error: "Title or body is invalid" }, { status: 400 });
  try {
    const { projectId } = await params;
    const item = await createWorkItem(projectId, auth.userId, body.kind, text);
    return NextResponse.json({ item }, { status: 201, headers: noStore });
  } catch (error) { return fail(error); }
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const auth = await requirePaidAIUser(req);
  if (!("userId" in auth)) return auth as NextResponse;
  const input: unknown = await req.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const body = input as Record<string, unknown>;
  if (!isWorkItemKind(body.kind) || typeof body.id !== "string") {
    return NextResponse.json({ error: "Invalid item reference" }, { status: 400 });
  }
  if (body.title === undefined && body.body === undefined &&
      body.status === undefined && body.comment === undefined) {
    return NextResponse.json({ error: "No changes supplied" }, { status: 400 });
  }
  if ((body.title !== undefined && typeof body.title !== "string") ||
      (body.body !== undefined && typeof body.body !== "string") ||
      (body.status !== undefined && body.status !== "open" && body.status !== "closed") ||
      (body.comment !== undefined && typeof body.comment !== "string")) {
    return NextResponse.json({ error: "Invalid item changes" }, { status: 400 });
  }
  try {
    const { projectId } = await params;
    const item = await updateWorkItem(projectId, auth.userId, body.kind, body.id, {
      title: body.title as string | undefined,
      body: body.body as string | undefined,
      status: body.status as "open" | "closed" | undefined,
      comment: body.comment as string | undefined,
    });
    return NextResponse.json({ item }, { headers: noStore });
  } catch (error) { return fail(error); }
}
