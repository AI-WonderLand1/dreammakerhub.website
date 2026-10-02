import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("canonical NPC storage and ownership", () => {
  it("uses the authenticated NPC API instead of a nonexistent Supabase _npcs table", () => {
    const dashboard = read("apps/web/app/(workspace)/dashboard/npc/page.tsx");
    const editor = read("apps/web/app/(builder)/wonder-build/playcanvas/editor/[sceneId]/page.tsx");

    expect(dashboard).toContain('fetch("/api/npc"');
    expect(editor).toContain('fetch("/api/npc"');
    expect(dashboard).not.toContain('.from(\'_npcs\')');
    expect(editor).not.toContain('.from("_npcs")');
  });

  it("verifies NPC ownership before opening the live engine stream", () => {
    const live = read("apps/web/app/api/npc/live/route.ts");
    expect(live).toContain('await getNpc(npcId, userId)');
    expect(live).toContain('return new Response("NPC not found", { status: 404 })');
  });

  it("keeps database row mapping in snake_case", () => {
    const storage = read("apps/web/lib/npc/storage.ts");
    expect(storage).toContain("owner_id: npc.ownerId");
    expect(storage).toContain("created_at: npc.createdAt");
    expect(storage).toContain("updated_at: npc.updatedAt");
    expect(storage).not.toContain("ownerId: npc.ownerId");
  });
});
