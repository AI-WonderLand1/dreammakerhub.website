// infra/services/marketplace/MarketplaceAgent.ts
import { logger } from "@lib/logger";

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
};

/**
 * MarketplaceAgent (ship-now)
 * - MegaProvider removed
 * - CloudProvider not required
 * - This layer exists so dashboard/IDE can call "install"
 *   while we later wire a real GitHub installer.
 */
export const MarketplaceAgent = {
  async install(req: MarketplaceInstallRequest): Promise<MarketplaceInstallResult> {
    if (!req?.packageId) {
      return { ok: false, error: "Missing packageId" };
    }

    logger.info("Marketplace install requested (stub)", {
      packageId: req.packageId,
      projectId: req.projectId,
      version: req.version,
      source: req.source,
    });

    // TODO (later):
    // - Fetch package from GitHub (or registry)
    // - Extract files
    // - Write into project storage (Supabase DB or local)
    // - Create snapshot + return installed files
    return {
      ok: true,
      installed: true,
      packageId: req.packageId,
      message: "Marketplace install stubbed (MegaProvider removed).",
    };
  },
};
