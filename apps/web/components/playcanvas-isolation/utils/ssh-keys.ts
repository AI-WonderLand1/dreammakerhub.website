import { randomBytes, createHash } from 'crypto';

export interface SSHKeyPair {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  createdAt: string;
  expiresAt: string;
}

export function generateSSHKeyPair(userId: string, expiresInHours: number = 24): SSHKeyPair {
  const timestamp = Date.now();
  const random = randomBytes(32).toString('hex');
  
  // Generate a deterministic key pair based on user + timestamp
  // In production, this would use proper RSA/Ed25519 key generation
  const keyId = createHash('sha256').update(`${userId}-${random}`).digest('hex').substring(0, 16);
  
  const privateKey = `-----BEGIN OPENSSH PRIVATE KEY-----
${Buffer.from(randomBytes(256)).toString('base64')}
-----END OPENSSH PRIVATE KEY-----`.replace(/\n/g, '');
  
  const publicKey = `ssh-ed25519 AAAA${randomBytes(32).toString('hex').substring(0, 64)} ${userId}-${keyId}@ai-wonderland`;
  
  const fingerprint = createHash('sha256').update(publicKey).digest('hex').substring(0, 16);
  
  const expiresAt = new Date(timestamp + expiresInHours * 60 * 60 * 1000).toISOString();
  
  return {
    publicKey,
    privateKey,
    fingerprint,
    createdAt: new Date(timestamp).toISOString(),
    expiresAt,
  };
}

export function validateSSHKey(key: SSHKeyPair): boolean {
  const now = new Date();
  const expiry = new Date(key.expiresAt);
  return now < expiry;
}

export function isKeyExpired(key: SSHKeyPair): boolean {
  return !validateSSHKey(key);
}

// In-memory store for user SSH keys (would use Redis/DB in production)
const userSSHKeys = new Map<string, SSHKeyPair>();

export function getOrCreateSSHKey(userId: string): SSHKeyPair {
  const existing = userSSHKeys.get(userId);
  
  if (existing && validateSSHKey(existing)) {
    return existing;
  }
  
  // Generate new key pair for user
  const newKey = generateSSHKeyPair(userId);
  userSSHKeys.set(userId, newKey);
  
  return newKey;
}

export function revokeSSHKey(userId: string): void {
  userSSHKeys.delete(userId);
}

export function getUserSSHKey(userId: string): SSHKeyPair | undefined {
  const key = userSSHKeys.get(userId);
  if (key && validateSSHKey(key)) {
    return key;
  }
  return undefined;
}