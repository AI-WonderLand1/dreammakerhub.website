import { z } from "zod";

export const artifactStatusSchema = z.enum(["uploaded", "processing", "deployed", "failed"]);

export const artifactMetadataSchema = z.object({
  projectId: z.string().trim().min(1),
  buildId: z.string().trim().min(1),
  createdAt: z.string().datetime({ offset: true }),
  status: artifactStatusSchema,
  publicPath: z.string().trim().min(1),
});

export type ArtifactMetadata = z.infer<typeof artifactMetadataSchema>;

const ROOT_PREFIX = "wonderspace/projects";

export function artifactZipPath(projectId: string, buildId: string) {
  return `${ROOT_PREFIX}/${projectId}/artifacts/${buildId}.zip`;
}

export function artifactMetadataPath(projectId: string, buildId: string) {
  return `${ROOT_PREFIX}/${projectId}/artifacts/metadata/${buildId}.json`;
}

export function artifactMetadataPrefix(projectId: string) {
  return `${ROOT_PREFIX}/${projectId}/artifacts/metadata`;
}

export function artifactPublicPath(projectId: string, buildId: string) {
  return `/api/wonderspace/projects/${projectId}/artifacts/${buildId}/download`;
}

export function parseArtifactMetadata(value: unknown) {
  return artifactMetadataSchema.safeParse(value);
}
