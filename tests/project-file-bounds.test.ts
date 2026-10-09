import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PROJECT_FILE_LIMITS,
  ProjectFileValidationError,
  validateProjectFileEntries,
} from "../apps/web/lib/projects/file-validation";

function check(entries: Array<{ path: unknown; content?: unknown }>) {
  validateProjectFileEntries(entries);
}

describe("project text-file batch validation", () => {
  it("accepts a normal multi-file save and empty text files", () => {
    expect(() => check([
      { path: "src/index.ts", content: "console.log('ok')" },
      { path: "README.md", content: "" },
    ])).not.toThrow();
  });

  it.each([
    "../index.ts",
    "src/../index.ts",
    "./index.ts",
    "/etc/passwd",
    "src//index.ts",
    "src\\secret.ts",
    ".wonderspace",
    ".wonderspace/wiki/entry.md",
    "a\u0000b.ts",
    "a\nb.ts",
    "x".repeat(PROJECT_FILE_LIMITS.maxPathLength + 1),
  ])("rejects unsafe path %j", (path) => {
    expect(() => check([{ path, content: "abc" }])).toThrow(ProjectFileValidationError);
  });

  it("rejects non-string contents rather than silently replacing files", () => {
    for (const content of [null, 0, false, {}, [], undefined]) {
      expect(() => check([{ path: "app.ts", content }])).toThrow("content must be text");
    }
  });

  it("rejects duplicate paths", () => {
    expect(() => check([
      { path: "index.ts", content: "first" },
      { path: "index.ts", content: "second" },
    ])).toThrow("Duplicate project file path");
  });

  it("rejects a file/directory conflict even if other names sort between them", () => {
    expect(() => check([
      { path: "a", content: "file" },
      { path: "a.b", content: "unrelated" },
      { path: "a/b", content: "nested" },
    ])).toThrow("A file conflicts with a directory path");
  });

  it("rejects a file over 5 MiB using UTF-8 byte size, not character count", () => {
    try {
      check([{ path: "large.txt", content: "é".repeat(3 * 1024 * 1024) }]);
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectFileValidationError);
      expect((error as ProjectFileValidationError).status).toBe(413);
    }
  });

  it("rejects more than 500 files", () => {
    const files = Array.from({ length: PROJECT_FILE_LIMITS.maxFiles + 1 },
      (_, i) => ({ path: `src/file-${i}.ts`, content: "x" }));
    expect(() => check(files)).toThrow("Too many files");
  });

  it("rejects aggregate batches exceeding 32 MiB", () => {
    const content = "a".repeat(4 * 1024 * 1024);
    const files = Array.from({ length: 9 },
      (_, i) => ({ path: `src/file-${i}.ts`, content }));
    expect(() => check(files)).toThrow("save exceeds 32 MiB");
  });

  it("uses one shared validator in both endpoints and storage", () => {
    const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
    expect(read("apps/web/lib/projects/storage.ts")).toContain("validateProjectFileEntries(entries)");
    expect(read("apps/web/app/api/projects/[projectId]/files/route.ts"))
      .toContain("validateProjectFileEntries(entries)");
    expect(read("apps/web/app/api/projects/[projectId]/import/route.ts"))
      .toContain("validateProjectFileEntries(entries)");
  });
});
