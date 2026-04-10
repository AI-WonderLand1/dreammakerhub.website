import crypto from "node:crypto";

const ALGO = "aes-256-gcm";

export type ByocCredentialPayload = Record<string, string>;

function getKey(): Buffer {
  const raw = process.env.BYOC_CREDENTIALS_ENCRYPTION_KEY || process.env.SECRETS_ENCRYPTION_KEY;
  
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BYOC_CREDENTIALS_ENCRYPTION_KEY or SECRETS_ENCRYPTION_KEY is required in production')
    }
    console.warn('WARNING: Using fallback encryption key in development. Set BYOC_CREDENTIALS_ENCRYPTION_KEY for production.')
    // Fallback only for development - should never reach here in production
    return crypto.createHash('sha256').update('dev-only-fallback-key-change-me').digest()
  }
  
  return crypto.createHash("sha256").update(raw).digest();
}

export function sanitizeCredentialPayload(payload: ByocCredentialPayload): ByocCredentialPayload {
  return Object.fromEntries(
    Object.entries(payload)
      .map(([key, value]) => [key.trim(), String(value ?? "").trim()])
      .filter(([key, value]) => key.length > 0 && value.length > 0),
  );
}

export function buildCredentialMetadata(payload: ByocCredentialPayload) {
  const clean = sanitizeCredentialPayload(payload);

  return Object.fromEntries(
    Object.entries(clean).map(([key, value]) => {
      const trimmed = value.trim();
      const last4 = trimmed.length >= 4 ? trimmed.slice(-4) : trimmed;
      return [key, last4 || null];
    }),
  );
}

export function encryptByocCredentials(payload: ByocCredentialPayload) {
  const clean = sanitizeCredentialPayload(payload);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const serialized = JSON.stringify(clean);
  const encrypted = Buffer.concat([cipher.update(serialized, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    credentials_ciphertext: encrypted.toString("base64"),
    credentials_iv: iv.toString("base64"),
    credentials_tag: authTag.toString("base64"),
    credentials_alg: ALGO,
    credentials_meta: buildCredentialMetadata(clean),
  };
}
