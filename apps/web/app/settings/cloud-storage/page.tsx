const PROVIDERS = [
  {
    name: "Supabase Storage",
    fields: ["Supabase URL", "Supabase anon key", "Bucket name"],
  },
  {
    name: "AWS S3",
    fields: ["Access key", "Secret key", "Bucket name", "Region"],
  },
  {
    name: "GCP Cloud Storage",
    fields: ["Service account JSON", "Bucket name"],
  },
] as const;

const BYOC_LAYERS = [
  { layer: "Auth", yourCloud: true, userCloud: false },
  { layer: "Workspace metadata", yourCloud: true, userCloud: false },
  { layer: "Project files (GLB, images, scenes)", yourCloud: false, userCloud: true },
  { layer: "Project JSON", yourCloud: false, userCloud: true },
  { layer: "Exports", yourCloud: false, userCloud: true },
  { layer: "AI generation", yourCloud: true, userCloud: false },
  { layer: "Editor (WebGLStudio)", yourCloud: true, userCloud: false },
  { layer: "Runtime (WonderPlay)", yourCloud: true, userCloud: false },
] as const;

const SUPABASE_CLIENT_EXAMPLE = `import { createClient } from "@supabase/supabase-js";

export function getUserSupabaseClient(user) {
  return createClient(
    user.cloud.supabaseUrl,
    user.cloud.supabaseKey,
  );
}`;

const SUPABASE_ROUTE_EXAMPLE = `const supabase = getUserSupabaseClient(user);

await supabase.storage
  .from(user.cloud.bucket)
  .upload(path, file);`;

const ASSET_RUNTIME_EXAMPLE = `app.assets.loadFromUrl(
  \`${"${user.cloud.publicUrl}/${path}"}\`,
  "container",
  (err, asset) => { ... }
);

LS.RM.loadResource(
  user.cloud.publicUrl + "/" + path,
  "mesh",
);`;

const AI_UPLOAD_EXAMPLE = `await supabase.storage
  .from(user.cloud.bucket)
  .upload(\`projects/${"${id}"}/scene.json\`, jsonBlob);`;

