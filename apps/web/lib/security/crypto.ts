import { createCipheriv, createDecipheriv, randomBytes, createHash, generateKeyPairSync } from "crypto";

let _encryptionKey: string | null = null;

function getEncryptionKey(): string {
  if (!_encryptionKey) {
    const key = process.env.SSH_KEY_ENCRYPTION_KEY;
    if (!key) {
      throw new Error(
        "SSH_KEY_ENCRYPTION_KEY environment variable is required. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
      );
    }
    _encryptionKey = key;
  }
  return _encryptionKey;
}

function deriveKey(masterKey: string): Buffer {
  return createHash('sha256').update(masterKey).digest();
}

export function encrypt(text: string): string {
  const key = deriveKey(getEncryptionKey());
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const key = deriveKey(getEncryptionKey());
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

function formatEd25519PublicKey(spkiDer: Buffer, comment: string): string {
  const algo = "ssh-ed25519";

  // SPKI DER for ed25519 is always: 30 2a 30 05 06 03 2b 65 70 03 21 00 <32 bytes>
  // Extract the raw 32-byte public key (last 32 bytes of DER)
  const rawPubKey = spkiDer.subarray(spkiDer.length - 32);

  // Build SSH wire format: len("ssh-ed25519") + "ssh-ed25519" + len(key) + key
  const algoBytes = Buffer.from(algo);
  const wireFormat = Buffer.alloc(4 + algoBytes.length + 4 + rawPubKey.length);
  wireFormat.writeUInt32BE(algoBytes.length, 0);
  algoBytes.copy(wireFormat, 4);
  wireFormat.writeUInt32BE(rawPubKey.length, 4 + algoBytes.length);
  rawPubKey.copy(wireFormat, 8 + algoBytes.length);

  return `${algo} ${wireFormat.toString('base64')} ${comment}`;
}

export function generateSSHKeyPair(comment: string): { privateKey: string; publicKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const sshPubKey = formatEd25519PublicKey(publicKey, comment);

  return { privateKey, publicKey: sshPubKey };
}