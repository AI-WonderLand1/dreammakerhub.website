import "server-only";
import { createClient } from "@supabase/supabase-js";
import { makeApiToken, verifyToken } from "@/lib/crypto/token";

// Never fall back to an anon or publishable key for credential operations.
function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Wonderland key storage is not configured");
  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const publicColumns = "id,name,prefix,created_at,last_used_at,expires_at,revoked_at";
const KEY_LIMIT = 5;

export async function listWonderlandKeys(userId: string) {
  const { data, error } = await admin().from("api_keys")
    .select(publicColumns).eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createWonderlandKey(userId: string, name: string) {
  const db = admin();
  const { count, error: countError } = await db.from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId).is("revoked_at", null);
  if (countError) throw countError;
  if ((count ?? 0) >= KEY_LIMIT) {
    return { limitReached: true as const };
  }

  // Prefix is customer-visible and uniquely identifies the database row.
  // Full token is revealed once and must not be logged or persisted in plaintext.
  const configured = (process.env.WONDER_API_KEY_PREFIX || "wai_live").replace(/_+$/, "");
  if (!/^[a-z][a-z0-9_]{0,20}$/.test(configured)) {
    throw new Error("Invalid WONDER_API_KEY_PREFIX");
  }
  const { token, token_hash } = await makeApiToken(configured);
  const prefix = token.slice(0, 24);
  const { data, error } = await db.from("api_keys")
    .insert({ user_id: userId, name, prefix, token_hash })
    .select(publicColumns).single();
  if (error) throw error;
  return { token, key: data };
}

export async function revokeWonderlandKey(userId: string, id: string) {
  const { data, error } = await admin().from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId).eq("id", id)
    .is("revoked_at", null)
    .select("id").maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

// For future metered generation routes, not a public key-verification endpoint.
// Billing/quota reservation must still occur BEFORE submitting GPU work.
export async function authenticateWonderlandKey(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7);
  if (!/^([a-z][a-z0-9_]{0,20})_[A-Za-z0-9_-]{35,}$/.test(token)
      || token.length > 200) return null;
  const prefix = token.slice(0, 24);
  const db = admin();
  const { data, error } = await db.from("api_keys")
    .select("id,user_id,token_hash,expires_at,revoked_at")
    .eq("prefix", prefix).maybeSingle();
  if (error || !data || data.revoked_at ||
      (data.expires_at && new Date(data.expires_at).getTime() <= Date.now())) return null;
  if (!(await verifyToken(token, data.token_hash))) return null;
  // Usage timestamp is best effort; do not alter authorization when it fails.
  await db.from("api_keys").update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);
  return { keyId: data.id as string, userId: data.user_id as string };
}
