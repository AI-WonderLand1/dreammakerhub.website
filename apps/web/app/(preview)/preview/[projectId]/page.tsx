import { readFile } from "@/lib/projects/storage";
import { createClient } from "@/app/utils/supabase/server";
import { injectWiringRuntime } from "@/lib/wonder-build/wiringRuntime";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

/**
 * Sanitize HTML to prevent XSS — strips dangerous tags/attributes while preserving safe content.
 */
function sanitizeHtml(html: string): string {
  let s = html;
  // Strip all event handlers (onclick, onerror, onload, etc.)
  s = s.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
  // Strip dangerous protocol URIs
  s = s.replace(/(?:href|src|action|data|codebase|formaction)\s*=\s*(?:"[^"]*"|'[^']*')/gi, (m) => {
    if (/javascript|data:text\/html|vbscript|file:/i.test(m)) {
      return m.replace(/=.*/, '=""');
    }
    return m;
  });
  // Strip dangerous tags and their content
  const DANGEROUS_TAGS = ['script', 'iframe', 'object', 'embed', 'form', 'svg', 'math', 'link', 'base', 'meta', 'style'];
  for (const tag of DANGEROUS_TAGS) {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>|<${tag}\\b[^>]*\\/?>`, 'gi');
    s = s.replace(regex, '');
  }
  return s;
}

/**
 * PreviewPage
 * Secure project preview (renders stored HTML + CSS for a user project)
 */
export default async function PreviewPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabaseClient = await createClient();
  
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    return (
      <div className="p-6 text-center text-red-500 font-medium bg-black min-h-screen">
        Unauthorized — please log in to view this project.
      </div>
    );
  }

  const html = await readFile(params.projectId, user.id, "index.html");
  const css = await readFile(params.projectId, user.id, "styles.css");

  if (!html) {
    return (
      <div className="p-6 text-yellow-400 font-medium bg-black min-h-screen">
        ⚠️ No <code>index.html</code> found for project: {params.projectId}
      </div>
    );
  }

  const styleTag = css ? `<style>${css}</style>` : "";
  const htmlWithWiring = injectWiringRuntime(styleTag + sanitizeHtml(html));

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

      <div
        className="bg-white text-black min-h-screen"
        dangerouslySetInnerHTML={{ __html: htmlWithWiring }}
      />
    </div>
  );
}
