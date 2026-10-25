import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("AI WONDERLAND Image Studio", () => {
  it("keeps Generate, History, and Assets in exclusive views with truthful controls", () => {
    const page = read("apps/web/components/studio/ImageStudioWorkspace.tsx");

    for (const label of [
      "Image Studio",
      "Prompt",
      "Quick Prompts",
      "Style",
      "Aspect Ratio",
      "Number of Images",
      "Generated Image",
      "Generation Settings",
      "Negative Prompt",
      "Recent Generations",
      "My Assets",
      "Your library",
    ]) {
      expect(page).toContain(label);
    }

    expect(page).toContain('activeView === "generate" && <div id="generate"');
    expect(page).toContain('activeView === "history" && <section id="history"');
    expect(page).toContain('activeView === "assets" && <section id="my-assets"');
    expect(page).toContain('const [settingsOpen, setSettingsOpen] = useState(false)');
    expect(page).toContain('fetch("/api/assets/user"');
    expect(page).toContain('saveTo');
    expect(page).not.toContain("Prompt Enhance");
    expect(page).not.toContain(">Upscale</button>");
    expect(page).not.toContain(">Save to Project</button>");
    expect(page).not.toContain("setQuality(");
    expect(page).toContain("Reuse Prompt");
    expect(page).toContain("View Project Files");
  });

  it("records generated images in the signed-in user library when requested", () => {
    const imageRoute = read("apps/web/app/api/ai/image/route.ts");
    const userAssets = read("apps/web/app/api/assets/user/route.ts");

    expect(imageRoute).toContain('saveTo === "library"');
    expect(imageRoute).toContain('from("user_assets").insert');
    expect(imageRoute).toContain('source: "ai-image"');
    expect(userAssets).toContain('a.source === "ai-image" ? a.local_url');
  });
});
