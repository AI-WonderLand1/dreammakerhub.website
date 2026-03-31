import { Octokit } from "@octokit/rest";
import { env, requireEnv } from "../../lib/env";
import { logger } from "../../lib/logger";

export class GithubSync {
  private static octokit = new Octokit({ auth: env.GITHUB_TOKEN });

  /**
   * Pushes a code update directly to a repository.
   * Priority: Ensures the customer's "Pro-Code" is always versioned.
   */
  static async pushUpdate(path: string, content: string, message: string) {
    if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
      logger.warn("GitHub sync skipped: missing credentials");
      return;
    }

    try {
      const [owner, repo] = requireEnv(env.GITHUB_REPO, "GITHUB_REPO").split('/');
      
      // Get the SHA of the existing file to update it
      let sha;
      try {
        const { data } = await this.octokit.repos.getContent({ owner, repo, path });
        if (!Array.isArray(data)) sha = data.sha;
      } catch (e) { /* File doesn't exist yet */ }

      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        sha
      });
      logger.info("[GitHub] Synced file", { path, repo });
    } catch (err) {
      logger.error("[GitHub Sync Error]", { error: err instanceof Error ? err.message : err });
    }
  }
}
