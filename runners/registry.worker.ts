import path from "node:path";

export type RegistrySource = "local" | "github" | "fab";
export type RegistryKind = "code-package" | "unreal-asset";

export type RegistryAsset = {
  id: string;
  source: RegistrySource;
  kind: RegistryKind;
  path?: string;
  url?: string;
  version?: string;
  targetDirectory?: string;
  vaultPath?: string;
};

export type RegistryDocument = {
  schemaVersion: number;
  assets: RegistryAsset[];
};

export type AssetPlan = {
  id: string;
  source: RegistrySource;
  kind: RegistryKind;
  targetDirectory: string;
  action: "verify-local" | "clone-github" | "map-fab-vault";
};

export function normalizeTargetDirectory(asset: RegistryAsset): string {
  if (asset.targetDirectory) return asset.targetDirectory;
  if (asset.kind === "code-package") {
    return asset.source === "local" && asset.path ? asset.path : path.posix.join("packages", asset.id);
  }
  return path.posix.join("Content", "Marketplace", asset.id);
}

export function planRegistryAssets(doc: RegistryDocument): AssetPlan[] {
  return doc.assets.map((asset) => {
    const action =
      asset.source === "local"
        ? "verify-local"
        : asset.source === "github"
        ? "clone-github"
        : "map-fab-vault";

    return {
      id: asset.id,
      source: asset.source,
      kind: asset.kind,
      targetDirectory: normalizeTargetDirectory(asset),
      action,
    };
  });
}

export function buildAIPrompt(plan: AssetPlan[]): string {
  const lines = plan.map(
    (item, index) =>
      `${index + 1}. asset=${item.id}; source=${item.source}; kind=${item.kind}; action=${item.action}; target=${item.targetDirectory}`,
  );
  return `Create an execution checklist for these registry assets:\n${lines.join("\n")}`;
}
