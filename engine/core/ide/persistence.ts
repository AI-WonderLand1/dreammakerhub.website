// engine/core/ide/persistence.ts
import { FileSystemManager } from "./filesystem";
import { GithubSync } from "@services/integrations/github";
import { logger } from "@lib/logger";

export class PersistenceManager {
  private static saveQueue: Map<string, NodeJS.Timeout> = new Map();

  static async autoSave(
    area: "wonder-build" | "WonderSpace",
    platform: string,
    content: string,
    projectId: string,
    isMarketplace: boolean = false
  ) {
    const key = `${area}-${platform}`;
    const existing = this.saveQueue.get(key);
    if (existing) clearTimeout(existing);

    const timeout = setTimeout(async () => {
      const path = `app/${area}/builder/canvas/${platform}Canvas.tsx`;

      try {
        // Local save only (keeps the system working)
        await FileSystemManager.saveFile(path, content);

        // Optional: sync to GitHub only when marketplace/repo-sync is enabled
        if (isMarketplace) {
          await GithubSync.pushUpdate(path, content, "Marketplace Update");
        }

        logger.info("✦ System Synced: Local (and GitHub if enabled).", {
          projectId,
          platform,
          isMarketplace,
        });
      } catch (err) {
        logger.error("Sync Failure", { error: err });
      }
    }, 1500);

    this.saveQueue.set(key, timeout);
  }
}
