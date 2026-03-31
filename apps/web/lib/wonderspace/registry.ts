import fs from "node:fs/promises";
import path from "node:path";
import {
  buildAIPrompt,
  planRegistryAssets,
  type AssetPlan,
  type RegistryDocument,
} from "@runners/registry.worker";

export type AssetSyncResult = AssetPlan & {
  status: "ready" | "missing";
  detail: string;
};

export async function loadRegistry(rootDir = process.cwd()): Promise<RegistryDocument> {
  const registryPath = path.join(rootDir, "registry.json");
  const raw = await fs.readFile(registryPath, "utf8");
  const doc = JSON.parse(raw) as RegistryDocument;

  if (!doc || doc.schemaVersion !== 1 || !Array.isArray(doc.assets)) {
    throw new Error("Invalid registry.json schema. Expected schemaVersion=1 and assets[].");
  }

  return doc;
}

export async function evaluateAssetPresence(doc: RegistryDocument, rootDir = process.cwd()): Promise<AssetSyncResult[]> {
  const plan = planRegistryAssets(doc);
  const results: AssetSyncResult[] = [];

  for (const item of plan) {
    const target = path.join(rootDir, item.targetDirectory);
    const exists = await fs
      .access(target)
      .then(() => true)
      .catch(() => false);

    results.push({
      ...item,
      status: exists ? "ready" : "missing",
      detail: exists ? "Target already present" : "Target missing and requires sync",
    });
  }

  return results;
}

export async function writeRegistryLock(results: AssetSyncResult[], rootDir = process.cwd()): Promise<void> {
  const lockPath = path.join(rootDir, "registry.lock.json");
  const payload = {
    generatedAt: new Date().toISOString(),
    assets: results,
  };
  await fs.writeFile(lockPath, JSON.stringify(payload, null, 2), "utf8");
}

export function buildRegistryAIPlan(results: AssetSyncResult[]): string {
  return buildAIPrompt(results);
}
