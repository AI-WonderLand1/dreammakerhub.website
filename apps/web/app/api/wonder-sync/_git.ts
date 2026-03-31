import path from "path";
import fs from "fs";
import simpleGit, { SimpleGit } from "simple-git";

function exists(p: string) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

export function findGitRoot(startDir: string) {
  let cur = startDir;
  for (let i = 0; i < 12; i++) {
    const gitDir = path.join(cur, ".git");
    if (exists(gitDir)) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

export function getGit(): { git: SimpleGit; root: string } {
  const cwd = process.cwd(); // usually apps/web when running Next
  const root = findGitRoot(cwd);
  if (!root) {
    throw new Error(
      `No .git found from ${cwd}. Make sure the Next server is running inside your repo.`
    );
  }
  const git = simpleGit({ baseDir: root });
  return { git, root };
}
