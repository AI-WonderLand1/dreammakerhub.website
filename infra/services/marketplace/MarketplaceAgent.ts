// infra/services/marketplace/MarketplaceAgent.ts
import { logger } from "@lib/logger";
import JSZip from "jszip";
import { Octokit } from "@octokit/rest";

export type MarketplaceInstallRequest = {
  packageId: string;
  projectId?: string;
  version?: string;
  source?: "github" | "local" | "unknown";
};

export type MarketplaceInstallResult = {
  ok: boolean;
  installed?: boolean;
  message?: string;
  error?: string;
  packageId?: string;
  files?: Array<{ path: string; content: string }>;
};

interface GitHubRepoInfo {
  owner: string;
  repo: string;
  version?: string;
}

function parseGitHubPackageId(packageId: string): GitHubRepoInfo | null {
  const match = packageId.match(/^github:([^\/]+)\/([^\/]+)(?:#([^\/]+))?$/);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    version: match[3],
  };
}

export const MarketplaceAgent = {
  async install(req: MarketplaceInstallRequest): Promise<MarketplaceInstallResult> {
    if (!req?.packageId) {
      return { ok: false, error: "Missing packageId" };
    }

    logger.info("Marketplace install requested", {
      packageId: req.packageId,
      projectId: req.projectId,
      version: req.version,
      source: req.source,
    });

    if (req.source === "github" || packageId.startsWith("github:")) {
      return this.installFromGitHub(req);
    }

    return {
      ok: true,
      installed: true,
      packageId: req.packageId,
      message: "Local/unknown source - install stubbed.",
    };
  },

  async installFromGitHub(req: MarketplaceInstallRequest): Promise<MarketplaceInstallResult> {
    const packageId = req.packageId.replace(/^github:/, "");
    const repoInfo = parseGitHubPackageId(`github:${packageId}`);

    if (!repoInfo) {
      return {
        ok: false,
        error: "Invalid GitHub package ID format. Expected: github:owner/repo or github:owner/repo#tag",
      };
    }

    const octokit = new Octokit();

    try {
      const ref = repoInfo.version || "main";
      logger.info(`Fetching GitHub repo: ${repoInfo.owner}/${repoInfo.repo} (ref: ${ref})`);

      let treeSha: string;

      try {
        const { data: refData } = await octokit.git.getRef({
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          ref: `heads/${ref}`,
        });
        treeSha = refData.object.sha;
      } catch {
        try {
          const { data: tagData } = await octokit.repos.getReleaseByTag({
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            tag: ref,
          });
          treeSha = tagData.target_commitish;
        } catch {
          const { data: commitData } = await octokit.repos.getCommit({
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            ref,
          });
          treeSha = commitData.sha;
        }
      }

      const { data: treeData } = await octokit.git.getTree({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        tree_sha: treeSha,
        recursive: "true",
      });

      const jszip = new JSZip();
      const maxFiles = 100;
      let fileCount = 0;

      for (const item of treeData.tree) {
        if (item.type === "blob" && item.path && item.sha) {
          if (fileCount >= maxFiles) {
            logger.warn(`Skipping files beyond limit (${maxFiles})`);
            break;
          }

          try {
            const { data: blobData } = await octokit.git.getBlob({
              owner: repoInfo.owner,
              repo: repoInfo.repo,
              file_sha: item.sha,
            });

            let content: string;
            if (typeof blobData.content === "string") {
              content = Buffer.from(blobData.content, "base64").toString("utf-8");
            } else {
              content = blobData.content as unknown as string;
            }

            jszip.file(item.path, content);
            fileCount++;
          } catch (err) {
            logger.warn(`Failed to fetch file ${item.path}`, err);
          }
        }
      }

      const zipBuffer = await jszip.generateAsync({ type: "nodebuffer" });

      logger.info(`Package ${req.packageId} installed successfully`, {
        fileCount,
        zipSize: zipBuffer.length,
      });

      return {
        ok: true,
        installed: true,
        packageId: req.packageId,
        message: `Installed ${fileCount} files from ${repoInfo.owner}/${repoInfo.repo}`,
        files: [{ path: "package.zip", content: zipBuffer.toString("base64") }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("GitHub install failed", error);

      return {
        ok: false,
        error: `Failed to install from GitHub: ${errorMessage}`,
        packageId: req.packageId,
      };
    }
  },
};
