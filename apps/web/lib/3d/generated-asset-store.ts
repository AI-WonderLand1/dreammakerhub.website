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
  provider?: string;
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
      tags: ["3d", input.provider || "hunyuan", "glb"],
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

/**
 * List generated GLB files owned by a user and attached to a specific project.
 * Only short-lived signed URLs leave the server; the bucket stays private.
 */
export async function listGeneratedProjectGlbs(userId: string, projectId: string) {
  const { supabase, bucket } = await ensureBucket();
  const prefix = `${userId}/${projectId}`;
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 100,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;

  const files = (data ?? []).filter((entry) =>
    /^3d_[a-zA-Z0-9_-]+[.]glb$/.test(entry.name)
  );
  const assets = await Promise.all(files.map(async (file) => {
    const path = `${prefix}/${file.name}`;
    const { data: signed, error: signingError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60);
    if (signingError || !signed?.signedUrl) throw signingError || new Error("Could not sign 3D asset");
    return {
      id: file.name.slice(0, -4),
      name: file.name,
      url: signed.signedUrl,
      expiresIn: 3600,
    };
  }));
  return assets;
}

/** Find an already persisted job result (idempotent completion polling). */
export async function getSavedGeneratedGlb(input: {
  userId: string;
  projectId?: string | null;
  id: string;
}) {
  const { supabase, bucket } = await ensureBucket();
  const safeProject = (input.projectId || "unassigned").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120);
  const prefix = `${input.userId}/${safeProject}`;
  const { data: entries, error } = await supabase.storage.from(bucket).list(prefix, {
    search: `${input.id}.glb`, limit: 20,
  });
  if (error && /not found/i.test(error.message || "")) return null;
  if (error) throw error;
  if (!entries?.some((file) => file.name === `${input.id}.glb`)) return null;
  const path = `${prefix}/${input.id}.glb`;
  const { data: signed, error: signError } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (signError || !signed?.signedUrl) throw signError || new Error("Could not sign GLB");
  return { path, signedUrl: signed.signedUrl, expiresIn: 3600 };
}

/** List private generated models from every project under the signed-in user. */
export async function listGeneratedUserGlbs(userId: string) {
  const { supabase, bucket } = await ensureBucket();
  const { data: folders, error } = await supabase.storage.from(bucket).list(userId, { limit: 100 });
  if (error) throw error;
  const projects = (folders || []).filter((item) => !item.id).map((item) => item.name);
  const results = await Promise.all(projects.map(async (projectId) => {
    const assets = await listGeneratedProjectGlbs(userId, projectId);
    return assets.map((asset) => ({ ...asset, projectId }));
  }));
  return results.flat();
}
