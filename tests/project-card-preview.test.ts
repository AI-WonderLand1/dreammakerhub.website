import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("project card previews",()=>{
  it("uses Next 16 async route params and renders saved WonderBuild state first",()=>{
    const preview=read("apps/web/app/(preview)/preview/[projectId]/page.tsx");
    expect(preview).toContain("params: Promise<{ projectId: string }>");
    expect(preview).toContain("const { projectId } = await params");
    expect(preview).toContain('readFile(projectId, user.id, "builder-state.json")');
    expect(preview).toContain("<PublishedBuilderPage");
    expect(preview).toContain("activeBuilderElements");
  });

  it("falls back to saved raw HTML without adding dashboard chrome to the thumbnail",()=>{
    const preview=read("apps/web/app/(preview)/preview/[projectId]/page.tsx");
    expect(preview).toContain('readFile(projectId, user.id, "index.html")');
    expect(preview).toContain("sanitizeUntrustedHtml");
    expect(preview).not.toContain("Previewing project:");
    expect(preview).not.toContain("Something went wrong");
  });

  it("refreshes dashboard preview iframes when project saved timestamp changes",()=>{
    const dashboard=read("apps/web/app/(workspace)/dashboard/page.tsx");
    const project=read("apps/web/app/(workspace)/dashboard/projects/[id]/page.tsx");
    expect(dashboard).toContain('/preview/${encodeURIComponent(project.id)}?v=');
    expect(project).toContain('/preview/${encodeURIComponent(project.id)}?v=');
  });

  it("does not send the project details page back to the retired WonderSpace IDE",()=>{
    const project=read("apps/web/app/(workspace)/dashboard/projects/[id]/page.tsx");
    expect(project).toContain("Open files");
    expect(project).not.toContain("Open in WonderSpace IDE");
  });
});
