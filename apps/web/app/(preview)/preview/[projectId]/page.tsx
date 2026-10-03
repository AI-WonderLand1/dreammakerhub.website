import { readFile } from "@/lib/projects/storage";
import { createClient } from "@/app/utils/supabase/server";
import { injectWiringRuntime } from "@/lib/wonder-build/wiringRuntime";
import { sanitizeUntrustedHtml } from "@/lib/security/sanitize-html.server";
import PublishedBuilderPage from "@/lib/builder/components/PublishedBuilderPage";
import type { BuilderTheme, CanvasElement, SitePage } from "@/lib/builder/types";

export const metadata = {
  title: "Project Preview",
  description: "Live preview of your AI WONDERLAND project.",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SavedBuilderState = {
  elements?: CanvasElement[];
  pages?: SitePage[];
  activePageId?: string;
  theme?: BuilderTheme;
};

function parseBuilderState(raw: string | null): SavedBuilderState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedBuilderState;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.elements) && !Array.isArray(parsed.pages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function activeBuilderElements(state: SavedBuilderState): CanvasElement[] {
  if (Array.isArray(state.pages) && state.pages.length > 0) {
    const active = state.pages.find((page) => page.id === state.activePageId) ?? state.pages[0];
    if (active && Array.isArray(active.elements)) return active.elements;
  }
  return Array.isArray(state.elements) ? state.elements : [];
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabaseClient = await createClient();
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07101b] p-6 text-center text-white">
        <div>
          <h1 className="text-lg font-semibold">Sign in required</h1>
          <p className="mt-2 text-sm text-white/50">Sign in to preview this project.</p>
        </div>
      </main>
    );
  }

  const [builderRaw, html, css] = await Promise.all([
    readFile(projectId, user.id, "builder-state.json"),
    readFile(projectId, user.id, "index.html"),
    readFile(projectId, user.id, "styles.css"),
  ]);

  const builderState = parseBuilderState(builderRaw);
  if (builderState) {
    const elements = activeBuilderElements(builderState);
    if (elements.length > 0) {
      return <PublishedBuilderPage elements={elements} theme={builderState.theme} />;
    }
  }

  if (html) {
    const sanitizedHtml = sanitizeUntrustedHtml(html);
    const htmlWithWiring = injectWiringRuntime(sanitizedHtml);
    return (
      <main className="min-h-screen bg-white text-black">
        {css ? <style>{css}</style> : null}
        <div dangerouslySetInnerHTML={{ __html: htmlWithWiring }} />
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_70%_25%,rgba(124,58,237,.22),transparent_35%),linear-gradient(145deg,#10182a,#07111d)] p-6 text-center text-white">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-xl">◇</div>
        <h1 className="mt-4 text-base font-semibold">Start designing this project</h1>
        <p className="mt-2 max-w-xs text-xs leading-5 text-white/45">
          The project is saved, but it does not have visual content to preview yet.
        </p>
      </div>
    </main>
  );
}
