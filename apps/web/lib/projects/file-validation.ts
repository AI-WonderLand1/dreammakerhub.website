/** Validation for first-party project text-file saves and imports.
 * Apply the same limits at the API edge and in storage so other callers
 * cannot bypass them. No database operations occur in this module.
 */
export const PROJECT_FILE_LIMITS = {
  maxFiles: 500,
  maxPathLength: 1024,
  maxFileBytes: 5 * 1024 * 1024,
  maxBatchBytes: 32 * 1024 * 1024,
} as const;

export class ProjectFileValidationError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 413,
  ) {
    super(message);
    this.name = "ProjectFileValidationError";
  }
}

export type ProjectTextFile = { path: string; content: string };

export function validateProjectFileEntries(
  entries: Array<{ path: unknown; content?: unknown }>,
): asserts entries is ProjectTextFile[] {
  if (!Array.isArray(entries)) {
    throw new ProjectFileValidationError("Files must be an array", 400);
  }
  if (entries.length > PROJECT_FILE_LIMITS.maxFiles) {
    throw new ProjectFileValidationError("Too many files in one save", 413);
  }

  const paths = new Set<string>();
  let totalBytes = 0;
  for (const entry of entries) {
    const filePath = entry?.path;
    if (
      typeof filePath !== "string" ||
      !filePath ||
      filePath.length > PROJECT_FILE_LIMITS.maxPathLength ||
      filePath.startsWith("/") ||
      /[\\\x00-\x1f\x7f]/.test(filePath) ||
      filePath.split("/").some((part) => !part || part === "." || part === "..") ||
      filePath === ".wonderspace" ||
      filePath.startsWith(".wonderspace/")
    ) {
      throw new ProjectFileValidationError("Invalid project file path", 400);
    }
    if (paths.has(filePath)) {
      throw new ProjectFileValidationError("Duplicate project file path", 400);
    }
    paths.add(filePath);
    if (typeof entry.content !== "string") {
      throw new ProjectFileValidationError("Project file content must be text", 400);
    }
    const size = Buffer.byteLength(entry.content, "utf8");
    if (size > PROJECT_FILE_LIMITS.maxFileBytes) {
      throw new ProjectFileValidationError("Project file exceeds 5 MiB", 413);
    }
    totalBytes += size;
    if (totalBytes > PROJECT_FILE_LIMITS.maxBatchBytes) {
      throw new ProjectFileValidationError("Project save exceeds 32 MiB", 413);
    }
  }

  // Detect file/directory conflicts even when other filenames sort between
  // the parent and child. Checking every slash-delimited prefix is reliable.
  for (const filePath of paths) {
    let slash = filePath.indexOf("/");
    while (slash !== -1) {
      if (paths.has(filePath.slice(0, slash))) {
        throw new ProjectFileValidationError("A file conflicts with a directory path", 400);
      }
      slash = filePath.indexOf("/", slash + 1);
    }
  }
}
