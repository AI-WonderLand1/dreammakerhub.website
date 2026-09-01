import 'server-only';

import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);
const SCRYPT_PREFIX = 'scrypt:v1:';
const KEY_BYTES = 32;
const SALT_BYTES = 16;

function decodeHex(value: string): Buffer | null {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) return null;
  return Buffer.from(value, 'hex');
}

function timingSafeEqual(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function deriveScrypt(apiKey: string, salt: Buffer): Promise<Buffer> {
  return (await scrypt(apiKey, salt, KEY_BYTES)) as Buffer;
}

export async function hashApiKeyForStorage(apiKey: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTES);
  const derived = await deriveScrypt(apiKey, salt);
  return `${SCRYPT_PREFIX}${salt.toString('hex')}:${derived.toString('hex')}`;
}

async function legacySha256Digest(apiKey: string): Promise<Buffer> {
  const encoded = new TextEncoder().encode(apiKey);
  const digest = await crypto.webcrypto.subtle.digest('SHA-256', encoded);
  return Buffer.from(digest);
}

export async function verifyApiKeyHash(
  apiKey: string,
  storedHash: string,
): Promise<{ valid: boolean; upgradedHash?: string }> {
  if (!apiKey || !storedHash) return { valid: false };

  if (storedHash.startsWith(SCRYPT_PREFIX)) {
    const payload = storedHash.slice(SCRYPT_PREFIX.length);
    const [saltHex, digestHex] = payload.split(':');
    const salt = decodeHex(saltHex || '');
    const expected = decodeHex(digestHex || '');

    if (!salt || !expected || expected.length !== KEY_BYTES) {
      return { valid: false };
    }

    const actual = await deriveScrypt(apiKey, salt);
    return { valid: timingSafeEqual(actual, expected) };
  }

  // Backward-compatibility path for existing high-entropy API keys. A valid
  // legacy SHA-256 record is immediately upgraded to scrypt by the caller.
  if (/^[0-9a-f]{64}$/i.test(storedHash)) {
    const expected = decodeHex(storedHash);
    if (!expected) return { valid: false };

    const actual = await legacySha256Digest(apiKey);
    if (!timingSafeEqual(actual, expected)) return { valid: false };

    return {
      valid: true,
      upgradedHash: await hashApiKeyForStorage(apiKey),
    };
  }

  return { valid: false };
}
