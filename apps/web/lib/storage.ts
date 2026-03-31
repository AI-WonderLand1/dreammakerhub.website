import { supabaseServer } from "./supabaseServer";

const THUMBNAILS_BUCKET = "thumbnails";
const ASSETS_BUCKET = "3d-assets";

export async function uploadThumbnail(userId: string, projectId: string, file: Buffer, mimeType: string) {
  const path = `${userId}/${projectId}/thumbnail.png`;

  const { error } = await supabaseServer.storage
    .from(THUMBNAILS_BUCKET)
    .upload(path, file, {
      contentType: mimeType,
      upsert: true
    });

  if (error) throw error;

  const { data: publicUrl } = supabaseServer.storage
    .from(THUMBNAILS_BUCKET)
    .getPublicUrl(path);

  return publicUrl.publicUrl;
}

export async function uploadAsset(
  userId: string,
  projectId: string,
  relativePath: string,
  file: Buffer,
  mimeType: string
) {
  const path = `${userId}/${projectId}/${relativePath}`;

  const { error } = await supabaseServer.storage
    .from(ASSETS_BUCKET)
    .upload(path, file, {
      contentType: mimeType,
      upsert: true
    });

  if (error) throw error;

  const { data: publicUrl } = supabaseServer.storage
    .from(ASSETS_BUCKET)
    .getPublicUrl(path);

  return { path, url: publicUrl.publicUrl };
}

