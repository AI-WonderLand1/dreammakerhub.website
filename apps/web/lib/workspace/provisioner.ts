import { supabaseServer } from "@/lib/supabaseServer";
import { decrypt, encrypt } from "@/lib/security/crypto";
import { 
  createProjectSecret,
  createProjectDeployment,
  createProjectService,
  createNetworkPolicy,
  deleteProjectResources 
} from "@/lib/k8s/client";
import * as k8s from "@kubernetes/client-node";
import { generateKeyPairSync } from "crypto";
import { logger } from '@/lib/logger';

export async function getProjectSSHKey(projectId: string): Promise<string | null> {
  const { data, error } = await supabaseServer
    .from("project_ssh_keys")
    .select("private_key_encrypted")
    .eq("project_id", projectId)
    .single();

  if (error || !data) {
    logger.error("Failed to get SSH key:", error);
    return null;
  }

  try {
    return decrypt(data.private_key_encrypted);
  } catch (e) {
    logger.error("SSH key decryption failed:", e);
    return null;
  }
}

export async function createProjectPVC(projectId: string, size: string = "1Gi"): Promise<boolean> {
  try {
    const { CoreV1Api } = k8s;
    const kc = new k8s.KubeConfig();
    
    try {
      kc.loadFromCluster();
    } catch {
      kc.loadFromDefault();
    }
    
    const coreApi = kc.makeApiClient(CoreV1Api);
    
    const pvc = {
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: {
        name: `wonder-files-${projectId}`,
        labels: {
          'app.kubernetes.io/name': 'wonder-runtime',
          'app.kubernetes.io/project-id': projectId
        }
      },
      spec: {
        accessModes: ['ReadWriteOnce'],
        resources: {
          requests: {
            storage: size
          }
        },
        storageClassName: 'oci',
        volumeMode: 'Filesystem'
      }
    };
    
    await coreApi.createNamespacedPersistentVolumeClaim('default', pvc);
    return true;
  } catch (error: any) {
    if (error.response?.body?.reason === 'AlreadyExists') {
      return true;
    }
    logger.error('PVC creation failed:', error.message);
    return false;
  }
}

export async function createProjectRuntime(
  projectId: string,
  options?: { storageSize?: string }
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Auto-generate SSH key pair if it doesn't exist
    let privateKey = await getProjectSSHKey(projectId);
    if (!privateKey) {
      const { publicKey, privateKey: privKey } = generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      
      // Store encrypted private key and public key in database
      const encryptedPrivateKey = encrypt(privKey);
      
      await supabaseServer
        .from("project_ssh_keys")
        .insert({
          project_id: projectId,
          public_key: publicKey,
          private_key_encrypted: encryptedPrivateKey,
          created_at: new Date().toISOString()
        });
      
      privateKey = privKey;
    }

    const image = process.env.RUNTIME_IMAGE || 'ord.ocir.io/axgejcaos4uw/ai-wonderland/wonder-runtime:latest';
    const storageSize = options?.storageSize || '1Gi';

    await createProjectPVC(projectId, storageSize);
    await createProjectSecret(projectId, privateKey);
    await createProjectDeployment(projectId, image);
    await createProjectService(projectId);
    await createNetworkPolicy(projectId);

    const domain = process.env.RUNTIME_DOMAIN || 'wonder.dev';
    const runtimeUrl = `https://${projectId}.${domain}`;

    return { success: true, url: runtimeUrl };
  } catch (error: any) {
    logger.error("Runtime provisioning failed:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteProjectRuntime(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteProjectResources(projectId);
    
    try {
      const { CoreV1Api } = k8s;
      const kc = new k8s.KubeConfig();
      kc.loadFromDefault();
      const coreApi = kc.makeApiClient(CoreV1Api);
      await coreApi.deleteNamespacedPersistentVolumeClaim(`wonder-files-${projectId}`, 'default');
    } catch {}
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getRuntimeStatus(
  projectId: string
): Promise<{ running: boolean; url?: string; storage?: string }> {
  try {
    const { AppsV1Api, CoreV1Api } = k8s;
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    const appsApi = kc.makeApiClient(AppsV1Api);
    const coreApi = kc.makeApiClient(CoreV1Api);

    const deployment = await appsApi.readNamespacedDeployment(
      `wonder-runtime-${projectId}`,
      'default'
    );

    if (deployment.body?.status?.readyReplicas === 1) {
      let storageUsed = null;
      
      try {
        const pvc = await coreApi.readNamespacedPersistentVolumeClaim(
          `wonder-files-${projectId}`,
          'default'
        );
        storageUsed = pvc.body?.status?.capacity?.storage || 'unknown';
      } catch {}
      
      const domain = process.env.RUNTIME_DOMAIN || 'wonder.dev';
      return { 
        running: true, 
        url: `https://${projectId}.${domain}`,
        storage: storageUsed
      };
    }

    return { running: false };
  } catch {
    return { running: false };
  }
}

export async function saveProjectFiles(
  projectId: string,
  files: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const runtimeUrl = await getProjectRuntimeUrl(projectId);
    
    if (!runtimeUrl) {
      return { success: false, error: "Runtime not running" };
    }

    const response = await fetch(`${runtimeUrl}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files }),
      signal: AbortSignal.timeout(30000)
    });

    if (response.ok) {
      return { success: true };
    }
    
    return { success: false, error: "Save failed" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function loadProjectFiles(
  projectId: string
): Promise<{ success: boolean; files?: Record<string, any>; error?: string }> {
  try {
    const runtimeUrl = await getProjectRuntimeUrl(projectId);
    
    if (!runtimeUrl) {
      return { success: false, error: "Runtime not running" };
    }

    const response = await fetch(`${runtimeUrl}/files`, {
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const files = await response.json();
      return { success: true, files };
    }
    
    return { success: false, error: "Load failed" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getProjectRuntimeUrl(projectId: string): Promise<string | null> {
  try {
    const { CoreV1Api } = k8s;
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    const coreApi = kc.makeApiClient(CoreV1Api);

    const result = await coreApi.readNamespacedService(
      `wonder-runtime-${projectId}`,
      'default'
    );
    
    if (result.body?.spec?.clusterIP) {
      return `http://${result.body.spec.clusterIP}:3090`;
    }
  } catch {}
  
  return null;
}