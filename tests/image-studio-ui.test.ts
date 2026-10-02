import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("AI WONDERLAND Image Studio", () => {
  it("renders the full studio layout and keeps the user asset library below the generator", () => {
    const page = read("apps/web/app/(workspace)/dashboard/images/page.tsx");

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
      "Advanced Settings",
      "Recent Generations",
      "My Assets",
      "Your library",
    ]) {
      expect(page).toContain(label);
    }

    expect(page.indexOf('id="my-assets"')).toBeGreaterThan(page.indexOf('id="history"'));
    expect(page).toContain('fetch("/api/assets/user"');
    expect(page).toContain('saveTo');
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
