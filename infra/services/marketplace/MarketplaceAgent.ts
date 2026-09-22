// infra/services/marketplace/MarketplaceAgent.ts
import { logger } from "../../../apps/web/lib/logger";
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
    if (!req?.packageId?.trim()) {
      return { ok: false, installed: false, error: "Missing packageId" };
    }

    logger.info("Marketplace install requested", {
      packageId: req.packageId,
      projectId: req.projectId,
      version: req.version,
      source: req.source,
    });

    if (req.source === "github" || req.packageId.startsWith("github:")) {
      return this.installFromGitHub(req);
    }

    // Do not claim a successful install when no local installer exists.
    return {
      ok: false,
      installed: false,
      packageId: req.packageId,
      error: "Local and unknown marketplace sources are not supported yet.",
    };
  },

  async installFromGitHub(req: MarketplaceInstallRequest): Promise<MarketplaceInstallResult> {
    const packageId = req.packageId.replace(/^github:/, "");
    const repoInfo = parseGitHubPackageId(`github:${packageId}`);

    if (!repoInfo) {
      return {
        ok: false,
        installed: false,
        packageId: req.packageId,
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

      const maxFiles = 100;
      const blobs = treeData.tree.filter((item) => item.type === "blob");
      if (treeData.truncated || blobs.length > maxFiles) {
        return {
          ok: false,
          installed: false,
          packageId: req.packageId,
          error: `GitHub package exceeds the supported ${maxFiles}-file limit or its tree is incomplete. Nothing was installed.`,
        };
      }
      if (!blobs.length || blobs.some((item) => !item.path || !item.sha)) {
        return {
          ok: false,
          installed: false,
          packageId: req.packageId,
          error: "GitHub package has no usable files or contains incomplete file metadata.",
        };
      }

      const jszip = new JSZip();
      for (const item of blobs) {
        // A failed fetch must not silently produce an incomplete archive.
        const { data: blobData } = await octokit.git.getBlob({
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          file_sha: item.sha!,
        });
        if (typeof blobData.content !== "string" || blobData.encoding !== "base64") {
          throw new Error(`Unsupported blob encoding for ${item.path}`);
        }
        jszip.file(item.path!, Buffer.from(blobData.content, "base64"));
      }

      const zipBuffer = await jszip.generateAsync({ type: "nodebuffer" });
      logger.info(`Prepared GitHub package archive ${req.packageId}`, {
        fileCount: blobs.length,
        zipSize: zipBuffer.length,
      });

      // Returning an archive is not the same as installing it into a project.
      return {
        ok: true,
        installed: false,
        packageId: req.packageId,
        message: `Prepared ${blobs.length} files from ${repoInfo.owner}/${repoInfo.repo}; installation into a project is not implemented.`,
        files: [{ path: "package.zip", content: zipBuffer.toString("base64") }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("GitHub package preparation failed", error);
      return {
        ok: false,
        installed: false,
        error: `Failed to prepare GitHub package: ${errorMessage}`,
        packageId: req.packageId,
      };
    }
  },
};
