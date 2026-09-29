/** Only a repository locator; never an authorization grant or a clone URL. */
export function parseGithubRepository(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let value = input.trim();
  if (value.startsWith("https://github.com/")) value = value.slice("https://github.com/".length);
  value = value.replace(/\.git\/?$/, "").replace(/\/$/, "");
  if (!value || value.length > 150 || /[?#%\\:@]/.test(value)) return null;
  const match = /^([a-z\d](?:[a-z\d-]{0,37}[a-z\d])?)\/([a-z\d_.-]{1,100})$/i.exec(value);
  if (!match || match[2] === "." || match[2] === "..") return null;
  return `${match[1]}/${match[2]}`;
}

export type GithubSection = "issues" | "pulls" | "discussions" | "actions" | "wiki" | "security";

export function githubRepositoryLink(repository: string, section: GithubSection): string | null {
  const fullName = parseGithubRepository(repository);
  if (!fullName) return null;
  const [owner, name] = fullName.split("/");
  return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/${section}`;
}
