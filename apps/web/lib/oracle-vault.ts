import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface OCIConfig {
  region: string;
  tenancyId: string;
  userId: string;
  keyFingerprint: string;
  privateKey: string;
  vaultOcid: string;
  compartmentId?: string;
}

interface VaultSecret {
  name: string;
  value: string;
}

let cachedSecrets: Map<string, string> = new Map();

function readOCIConfigFile(): OCIConfig | null {
  try {
    const configPath = path.join(os.homedir(), '.oci', 'config');
    const keyPath = path.join(os.homedir(), '.oci', 'oci_api_key.pem');

    if (!fs.existsSync(configPath) || !fs.existsSync(keyPath)) {
      return null;
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    const privateKey = fs.readFileSync(keyPath, 'utf-8');

    const config: any = {};
    const lines = configContent.split('\n');
    for (const line of lines) {
      const [key, value] = line.split('=').map(s => s.trim());
      if (key && value) config[key] = value;
    }

const vaultOcid = process.env.OCI_VAULT_OCID || 'ocid1.vault.oc1.us-chicago-1.iju5tgneaagfe.abxxeljryjr66w2biptepa5gm6ms532ghm2cowsaxzp3binj6s56ceykvbya';
    if (!vaultOcid) {
      return null;
    }

    return {
      region: config.region || 'us-chicago-1',
      tenancy: config.tenancy,
      user: config.user,
      fingerprint: config.fingerprint,
      privateKey: privateKey,
      vaultOcid: vaultOcid,
      compartmentId: config.tenancy
    };
  } catch (error) {
    console.error('[OracleVault] Failed to read OCI config file:', error);
    return null;
  }
}

export function getOCIConfig(): OCIConfig | null {
  const fileConfig = readOCIConfigFile();
  if (fileConfig) {
    return fileConfig;
  }

  const region = process.env.OCI_REGION;
  const tenancyId = process.env.OCI_TENANCY_ID;
  const userId = process.env.OCI_USER_ID;
  const keyFingerprint = process.env.OCI_KEY_FINGERPRINT;
  const privateKey = process.env.OCI_PRIVATE_KEY;
  const vaultOcid = process.env.OCI_VAULT_OCID;
  const compartmentId = process.env.OCI_COMPARTMENT_ID || tenancyId;

  if (!region || !tenancyId || !userId || !keyFingerprint || !privateKey || !vaultOcid) {
    return null;
  }

  return {
    region,
    tenancyId,
    userId,
    keyFingerprint,
    privateKey: privateKey.replace(/\\n/g, '\n'),
    vaultOcid,
    compartmentId
  };
}

async function makeOCISignedRequest(
  config: OCIConfig,
  method: string,
  path: string,
  body?: string
): Promise<any> {
  const host = `secrets.${config.region}.oraclecloud.com`;
  const date = new Date().toUTCString();
  
  const signingHeaders = `(request-target): ${method.toLowerCase()} ${path}\nhost: ${host}\ndate: ${date}`;
  
  const bodyHash = body ? crypto.createHash('sha256').update(body).digest('hex') : '';
  const signingString = body 
    ? `${signingHeaders}\ncontent-length: ${body.length}\nx-date: ${date}\nx-content-sha256: ${bodyHash}`
    : `${signingHeaders}\ndate: ${date}`;

  const signature = crypto.sign('RSA-SHA256', Buffer.from(config.privateKey), signingString);
  const signatureBase64 = signature.toString('base64');

  const authHeader = `Signature version="1",keyId="${config.tenancyId}/${config.userId}/${config.keyFingerprint}",algorithm="RSA-SHA256",headers="(request-target) host date",signature="${signatureBase64}"`;

  const response = await fetch(`https://${host}${path}`, {
    method,
    headers: {
      'Authorization': authHeader,
      'Date': date,
      'Content-Type': 'application/json',
      ...(body ? { 'Content-Length': body.length.toString() } : {})
    },
    body
  });

  if (!response.ok) {
    throw new Error(`OCI API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getSecretFromVault(secretName: string): Promise<string | null> {
  if (cachedSecrets.has(secretName)) {
    return cachedSecrets.get(secretName) || null;
  }

  const config = getOCIConfig();
  if (!config) {
    console.warn('[OracleVault] OCI config not available, falling back to env vars');
    return process.env[secretName] || null;
  }

  try {
    const path = `/20190301/secrets/${config.vaultOcid}/secret?name=${secretName}`;
    const data = await makeOCISignedRequest(config, 'GET', path);
    
    const secretValue = data.secretBundle?.secretContents?.content 
      ? Buffer.from(data.secretBundle.secretContents.content, 'base64').toString('utf-8')
      : null;
    
    if (secretValue) {
      cachedSecrets.set(secretName, secretValue);
    }
    
    return secretValue;
  } catch (error) {
    console.error(`[OracleVault] Failed to fetch secret ${secretName}:`, error);
    return process.env[secretName] || null;
  }
}

export async function getConvaiCredentials(): Promise<{ apiKey: string; characterId: string } | null> {
  const [apiKey, characterId] = await Promise.all([
    getSecretFromVault('CONVAI_API_KEY'),
    getSecretFromVault('CONVAI_CHARACTER_ID')
  ]);

  if (apiKey && characterId) {
    return { apiKey, characterId };
  }

  return null;
}

export function clearVaultCache(): void {
  cachedSecrets.clear();
}