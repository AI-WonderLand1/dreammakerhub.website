import { storageProvider } from "@infra/services/storage/provider";
import {
  artifactMetadataPath,
  artifactMetadataPrefix,
  artifactZipPath,
  parseArtifactMetadata,
  type ArtifactMetadata,
} from "@/lib/wonderspace/artifacts";

export async function saveArtifact(projectId: string, metadata: ArtifactMetadata, zip: Buffer) {
  await storageProvider.upload(artifactZipPath(projectId, metadata.buildId), zip);
  await storageProvider.upload(
    artifactMetadataPath(projectId, metadata.buildId),
    Buffer.from(JSON.stringify(metadata, null, 2), "utf8"),
  );
}

export async function getArtifactMetadata(projectId: string, buildId: string) {
  const { data } = await storageProvider.download(artifactMetadataPath(projectId, buildId));
  if (!data) {
    return null;
  }

  const parsed = parseArtifactMetadata(JSON.parse(await data.text()));
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export async function listArtifactMetadata(projectId: string) {
  const { data, error } = await storageProvider.list(artifactMetadataPrefix(projectId));
  if (error || !data) {
    throw new Error(error?.message || "Unable to list artifacts");
  }

  const artifacts = await Promise.all(
    data.map(async (entry) => {
      const buildId = entry.name.replace(/\.json$/i, "").trim();
      if (!buildId) return null;
      return getArtifactMetadata(projectId, buildId);
    }),
  );

  return artifacts
    .filter((artifact): artifact is ArtifactMetadata => Boolean(artifact))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function readArtifactZip(projectId: string, buildId: string) {
  const { data } = await storageProvider.download(artifactZipPath(projectId, buildId));
  return data;
}
