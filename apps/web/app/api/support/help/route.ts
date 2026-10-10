import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Public, deterministic help answers. No model, database access, billing or tools.
// Never use these answers as proof of account or infrastructure state.
type Topic = { match: RegExp; text: string };
const TOPICS: Topic[] = [
  { match: /\b(api[ -]?key|token|credential)\b/i, text: "Open Dashboard and look for API Keys to create or revoke a key. New secrets are shown once; save them securely. If the API Keys section is missing or fails, contact support at /contact. Never paste a secret key into chat." },
  { match: /\b(ide|coder|workspace|terminal|code editor)\b/i, text: "Open your project and choose the IDE/workspace option. Starting a stopped workspace can take time; if it does not open, retry once and check workspace status. For persistent errors, contact /contact with the time and error message, not credentials." },
  { match: /\b(bill|subscription|price|plan|payment|credit|refund)\b/i, text: "Review your subscription and usage details at /subscription and your signed-in dashboard. I cannot view account balances, charges or refunds. For a billing discrepancy use /contact and never send payment card details here." },
  { match: /\b(build|website|project|publish|deploy|preview|template)\b/i, text: "Open Dashboard, select a project or create a new one, then use the visual builder or full-page editor. Preview and save before publishing. This support chat does not modify projects or run builds; report editor errors at /contact." },
  { match: /\b(3d|asset|model|video|image|npc|playcanvas)\b/i, text: "Choose the relevant 3D or media tool from the dashboard. Some generation functions can be paused or subject to credits. This help assistant cannot generate media or confirm job status. Report failed jobs through /contact." },
  { match: /\b(login|log in|sign in|password|account|register|auth)\b/i, text: "Try signing in again through the site's login page. If the session has expired, sign out and sign back in. Do not share passwords or recovery codes. Contact /contact if the issue persists." },
  { match: /\b(error|broken|fail|bug|troubleshoot|not working|stuck|503|404)\b/i, text: "Please note the page, exact error text, and what action triggered it. Try refreshing once; do not repeatedly submit payments or destructive actions. Send a report via /contact without including passwords or API keys." },
  { match: /\b(help|support|contact|human|ticket)\b/i, text: "I can help with navigation, billing guidance, IDE access, project workflows and common errors. For a person or an unresolved issue, use /contact. I cannot access account records or create a ticket from this chat." },
];
export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 4096) return NextResponse.json({ error: "Message too large" }, { status: 413 });
  const body: unknown = await request.json().catch(() => null);
  const message = body && typeof body === "object" && "message" in body ? (body as { message?: unknown }).message : null;
  if (typeof message !== "string" || message.trim().length < 1 || message.length > 1200) {
    return NextResponse.json({ error: "Message must contain 1–1200 characters" }, { status: 400 });
  }
  const answer = TOPICS.find((topic) => topic.match.test(message))?.text ??
    "I can guide you through the dashboard, projects, IDE, API keys, subscriptions and common errors. Tell me which feature you are using and what happened, or use /contact for human assistance. I cannot inspect your account or change files.";
  return NextResponse.json({ ok: true, text: answer, mode: "guided-support", aiGenerated: false }, {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
