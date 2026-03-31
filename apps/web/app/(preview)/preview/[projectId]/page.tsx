import { readFile } from "@lib/projects/storage";
import { createClient } from "@/app/utils/supabase/server";
import { injectWiringRuntime } from "@/lib/wonder-build/wiringRuntime";

export const runtime = "nodejs";

/**
 * PreviewPage
 * Secure project preview (renders stored HTML + CSS for a user project)
 */
export default async function PreviewPage({
  params,
}: {
  params: { projectId: string };
}) {
  // FIX: In Next.js SSR, the supabase client creator is often async.
  // We must await the client itself before accessing .auth
  const supabaseClient = await createClient();
  
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  // ───────────────────────────────
  //  Auth check
  // ───────────────────────────────
  if (!user) {
    return (
      <div className="p-6 text-center text-red-500 font-medium bg-black min-h-screen">
        Unauthorized — please log in to view this project.
      </div>
    );
  }

  // ───────────────────────────────
  //  Fetch project files
  // ───────────────────────────────
  const html = await readFile(params.projectId, user.id, "index.html");
  const css = await readFile(params.projectId, user.id, "styles.css");

  // ───────────────────────────────
  //  Missing HTML
  // ───────────────────────────────
  if (!html) {
    return (
      <div className="p-6 text-yellow-400 font-medium bg-black min-h-screen">
        ⚠️ No <code>index.html</code> found for project: {params.projectId}
      </div>
    );
  }

  // ───────────────────────────────
  //  Render
  // ───────────────────────────────
  const styleTag = css ? `<style>${css}</style>` : "";
  const htmlWithWiring = injectWiringRuntime(styleTag + html);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 p-4 flex items-center justify-between bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="text-sm text-gray-300">
          Previewing project:{" "}
          <span className="font-semibold text-purple-400">
            {params.projectId}
          </span>
        </div>
      </header>

      {/* The actual project render area */}
      <div
        className="bg-white text-black min-h-screen"
        dangerouslySetInnerHTML={{ __html: htmlWithWiring }}
      />
    </div>
  );
}
