import { NextRequest, NextResponse } from "next/server";
import { requirePaidAIUser } from "@/app/api/ai/auth";
import { deleteFile, getProjectMetadata, readFile, writeFile } from "@/lib/projects/storage";
import { parseGithubRepository } from "@/lib/wonderspace/github-repository";

const connectionPath = ".wonderspace/github-repository.json";
type Params = { params: Promise<{ projectId: string }> };
const fail = (message: string, status: number) =>
  NextResponse.json({ ok: false, message }, { status });

async function ownerOf(req: NextRequest, projectId: string) {
  const auth = await requirePaidAIUser(req);
  if (!("userId" in auth)) return auth;
  // Owner-verified project storage also enforces Supabase RLS. No service role.
  await getProjectMetadata(projectId, auth.userId);
  return auth.userId;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  let owner: string;
  try {
    const result = await ownerOf(req, projectId);
    if (typeof result !== "string") return result;
    owner = result;
  } catch {
    return fail("Project not found or access was denied.", 404);
  }
  try {
    const file = await readFile(projectId, owner, connectionPath);
    if (!file) return NextResponse.json({ ok: true, repository: null });
    const parsed: unknown = JSON.parse(file);
    const record = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
    const repository = parseGithubRepository(record.repository);
    if (!repository) return NextResponse.json({ ok: true, repository: null });
    // The link file can be edited through the customer's own file manager.
    // Revalidate on EVERY navigation read; never trust its embedded timestamp
    // as proof of GitHub access or allow it to grant backend permissions.
    const githubToken = req.headers.get("x-github-oauth-token")?.trim();
    if (githubToken && (githubToken.length > 1024 || /\s/.test(githubToken))) {
      return fail("Invalid GitHub session.", 400);
    }
    const verified = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
      },
      signal: AbortSignal.timeout(8000),
      ...(githubToken ? { cache: "no-store" as const } : { next: { revalidate: 300 } }),
    });
    if (!verified.ok) return fail("GitHub repository could not be reverified.", 503);
    const info = await verified.json();
    if (parseGithubRepository(info?.full_name)?.toLowerCase() !== repository.toLowerCase()) {
      return fail("GitHub returned a different repository.", 503);
    }
    if (info.private && !githubToken) return fail("Private repository authorization required.", 403);
    return NextResponse.json({
      ok: true,
      repository: { fullName: info.full_name, verifiedAt: new Date().toISOString() },
    });
  } catch {
    return fail("GitHub connection unavailable or project access denied.", 503);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  let owner: string;
  try {
    const result = await ownerOf(req, projectId);
    if (typeof result !== "string") return result;
    owner = result;
  } catch {
    return fail("Project was not found or access was denied.", 404);
  }

  const body = await req.json().catch(() => null);
  const repository = parseGithubRepository(body?.repository);
  if (!repository) return fail("Enter a GitHub repository as owner/name or its GitHub URL.", 400);

  // A Supabase GitHub session may supply a short-lived GitHub provider token.
  // Use it ONLY for this verification request. Never save it in project files,
  // logs, localStorage, or the returned JSON. Public repositories need no token.
  const githubToken = req.headers.get("x-github-oauth-token")?.trim();
  if (githubToken && (githubToken.length > 1024 || /\s/.test(githubToken))) return fail("Invalid GitHub session.", 400);
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) {
      return fail(
        response.status === 404 || response.status === 403
          ? "Repository unavailable. For a private repository, connect a GitHub account with access."
          : "GitHub could not verify this repository. Try again.",
        response.status === 404 || response.status === 403 ? 422 : 503,
      );
    }
    const result = await response.json();
    if (parseGithubRepository(result?.full_name)?.toLowerCase() !== repository.toLowerCase()) {
      return fail("GitHub returned a different repository. Check the repository name.", 422);
    }
    if (result.private && !githubToken) return fail("A GitHub-authorized session is required for private repositories.", 422);
    // This only saves an external navigation link. GitHub write/sync access
    // must be authorized independently; never infer it from a readable repo.
    const verifiedAt = new Date().toISOString();
    await writeFile(projectId, owner, connectionPath, JSON.stringify({ repository: result.full_name, verifiedAt }, null, 2));
    return NextResponse.json({ ok: true, repository: { fullName: result.full_name, verifiedAt }, syncEnabled: false });
  } catch {
    return fail("The repository link was not saved. Check GitHub access and try again.", 503);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  try {
    const owner = await ownerOf(req, projectId);
    if (typeof owner !== "string") return owner;
    await deleteFile(projectId, owner, connectionPath);
    return NextResponse.json({ ok: true, repository: null });
  } catch {
    return fail("Project not found or repository could not be unlinked.", 404);
  }
}
