import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { readFileSync } from "fs";

const ENCRYPTION_KEY = process.env.SSH_KEY_ENCRYPTION_KEY || randomBytes(32).toString('hex');

function deriveKey(masterKey: string): Buffer {
  return createHash('sha256').update(masterKey).digest();
}

export function encrypt(text: string): string {
  const key = deriveKey(ENCRYPTION_KEY);
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const key = deriveKey(ENCRYPTION_KEY);
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function generateSSHKeyPair(comment: string): { privateKey: string; publicKey: string } {
  const { execSync } = require('child_process');
  const tempPath = `/tmp/wonder-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  try {
    execSync(`ssh-keygen -t ed25519 -f ${tempPath} -N "" -C "${comment}" -q`, {
      stdio: 'pipe'
    });
    
    const privateKey = readFileSync(tempPath, 'utf-8');
    const publicKey = readFileSync(`${tempPath}.pub`, 'utf-8').trim();
    
    require('fs').unlinkSync(tempPath);
    require('fs').unlinkSync(`${tempPath}.pub`);
    
    return { privateKey, publicKey };
  } catch (error) {
    throw new Error(`SSH key generation failed: ${error}`);
  }
}