import "server-only";

import { createClient } from "@supabase/supabase-js";
import { compareTokenHash } from "@/lib/crypto/token";

export type ApiKeyPrincipal = {
  keyId: string;
  userId: string;
  name: string | null;
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();

  if (!url || !key) return null;

  return createClient<any>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function readBearerToken(req: Request): string | null {
  const value = req.headers.get("authorization")?.trim();
  if (!value) return null;

  const match = /^Bearer\s+(\S+)$/i.exec(value);
  return match?.[1] ?? null;
}

export async function authenticateWonderApiKey(
  req: Request,
): Promise<ApiKeyPrincipal | null> {
  const token = readBearerToken(req);
  if (!token) return null;

  const supabase = getServiceClient();
  if (!supabase) {
    throw new Error("API key authentication is not configured");
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id,user_id,name,token_hash,revoked_at")
    .is("revoked_at", null)
    .limit(1000);

  if (error) {
    throw new Error(`Unable to read API keys: ${error.message}`);
  }

  for (const row of data ?? []) {
    if (!row?.token_hash || !row?.id || !row?.user_id) continue;

    const valid = await compareTokenHash(token, row.token_hash).catch(() => false);
    if (!valid) continue;

    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", row.id);

    return {
      keyId: String(row.id),
      userId: String(row.user_id),
      name: row.name ? String(row.name) : null,
    };
  }

  return null;
}
