import "server-only";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_BUCKET = "3d-generated-assets";
const MAX_FILE_BYTES = 100 * 1024 * 1024;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error("Supabase service storage is not configured");
  }

  return createClient<any>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureBucket() {
  const supabase = getServiceClient();
  const bucket = process.env.WONDER_3D_ASSET_BUCKET?.trim() || DEFAULT_BUCKET;

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  if (!(buckets ?? []).some((item) => item.name === bucket)) {
    const { error } = await supabase.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: MAX_FILE_BYTES,
      allowedMimeTypes: ["model/gltf-binary", "application/octet-stream"],
    });
    if (error) throw error;
  }

  return { supabase, bucket };
}

export async function saveGeneratedGlb(input: {
  id: string;
  userId: string;
  projectId?: string | null;
  prompt: string;
  glb: Buffer;
}) {
  if (!input.glb.byteLength || input.glb.byteLength > MAX_FILE_BYTES) {
    throw new Error("Generated GLB is empty or exceeds the storage limit");
  }

  const { supabase, bucket } = await ensureBucket();
  const safeProject = (input.projectId || "unassigned")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 120);

  const path = `${input.userId}/${safeProject}/${input.id}.glb`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, input.glb, {
      contentType: "model/gltf-binary",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: signed, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);

  if (signedError) throw signedError;

  // Metadata is best-effort because older deployments may not yet have every
  // optional scene column. The GLB upload itself remains the source of truth.
  await supabase.from("scenes").upsert(
    {
      id: input.id,
      name: input.prompt.slice(0, 120),
      description: input.prompt,
      category: "ai-generated-3d",
      tags: ["3d", "hunyuan", "glb"],
      user_id: input.userId,
      data: {
        project_id: input.projectId ?? null,
        bucket,
        storage_path: path,
        format: "glb",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  ).then(() => undefined, () => undefined);

  return {
    bucket,
    path,
    signedUrl: signed.signedUrl,
    expiresIn: 3600,
  };
}
