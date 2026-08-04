import { CoreV1Api, AppsV1Api, NetworkingV1Api, KubeConfig } from '@kubernetes/client-node';
import { logger } from '@/lib/logger';

let coreApi: CoreV1Api | null = null;
let appsApi: AppsV1Api | null = null;
let netApi: NetworkingV1Api | null = null;

function getK8sClient(): { coreApi: CoreV1Api; appsApi: AppsV1Api; netApi: NetworkingV1Api } {
  if (coreApi && appsApi && netApi) {
    return { coreApi, appsApi, netApi };
  }
  
  const kc = new KubeConfig();
  
  try {
    kc.loadFromCluster();
  } catch {
    kc.loadFromDefault();
  }
  
  coreApi = kc.makeApiClient(CoreV1Api);
  appsApi = kc.makeApiClient(AppsV1Api);
  netApi = kc.makeApiClient(NetworkingV1Api);
  
  return { coreApi, appsApi, netApi };
}

async function createProjectSecret(
  projectId: string, 
  privateKey: string
): Promise<boolean> {
  try {
    const { coreApi } = getK8sClient();
    
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: `wonder-ssh-key-${projectId}`,
        labels: {
          'app.kubernetes.io/name': 'wonder-runtime',
          'app.kubernetes.io/project-id': projectId
        }
      },
      type: 'Opaque',
      stringData: {
        'id_ed25519': privateKey,
        'ssh_config': `Host github.com
  HostName github.com
  User git
  IdentityFile /root/.ssh/id_ed25519
  StrictHostKeyChecking no`
      }
    };
    
    await coreApi.createNamespacedSecret({ namespace: 'default', body: secret });
    return true;
  } catch (error: any) {
    if (error.response?.body?.reason === 'AlreadyExists') {
      return true;
    }
    logger.error('Secret creation failed:', error.message);
    return false;
  }
}

async function createProjectDeployment(
  projectId: string,
  image: string
): Promise<boolean> {
  try {
    const { appsApi } = getK8sClient();
    
    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: `wonder-runtime-${projectId}`,
        labels: {
          'app.kubernetes.io/name': 'wonder-runtime',
          'app.kubernetes.io/project-id': projectId
        }
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            'app.kubernetes.io/project-id': projectId
          }
        },
        template: {
          metadata: {
            labels: {
              'app.kubernetes.io/name': 'wonder-runtime',
              'app.kubernetes.io/project-id': projectId
            }
          },
          spec: {
            containers: [{
              name: 'runtime',
              image: image,
              ports: [{ containerPort: 3090, name: 'http' }],
              env: [
                { name: 'PROJECT_ID', value: projectId },
                { name: 'SSH_KEY_PATH', value: '/run/secrets/wonder-ssh/id_ed25519' }
              ],
              volumeMounts: [{
                name: 'ssh-key',
                mountPath: '/run/secrets/wonder-ssh',
                readOnly: true
              }],
              resources: {
                requests: { memory: '512Mi', cpu: '250m' },
                limits: { memory: '1Gi', cpu: '1000m' }
              },
              securityContext: {
                runAsNonRoot: true,
                runAsUser: 1000,
                allowPrivilegeEscalation: false,
                capabilities: { drop: ['ALL'] }
              }
            }],
            volumes: [{
              name: 'ssh-key',
              secret: {
                secretName: `wonder-ssh-key-${projectId}`,
                optional: false
              }
            }]
          }
        }
      }
    };
    
    await appsApi.createNamespacedDeployment({ namespace: 'default', body: deployment });
    return true;
  } catch (error: any) {
    if (error.response?.body?.reason === 'AlreadyExists') {
      return true;
    }
    logger.error('Deployment creation failed:', error.message);
    return false;
  }
}

async function createProjectService(projectId: string): Promise<boolean> {
  try {
    const { coreApi } = getK8sClient();
    
    const service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: `wonder-runtime-${projectId}`,
        labels: {
          'app.kubernetes.io/name': 'wonder-runtime',
          'app.kubernetes.io/project-id': projectId
        }
      },
      spec: {
        selector: {
          'app.kubernetes.io/project-id': projectId
        },
        ports: [{
          port: 443,
          targetPort: 3090,
          name: 'http'
        }]
      }
    };
    
    await coreApi.createNamespacedService({ namespace: 'default', body: service });
    return true;
  } catch (error: any) {
    if (error.response?.body?.reason === 'AlreadyExists') {
      return true;
    }
    logger.error('Service creation failed:', error.message);
    return false;
  }
}

async function createNetworkPolicy(projectId: string): Promise<boolean> {
  try {
    const { netApi } = getK8sClient();
    
    const policy = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      metadata: {
        name: `wonder-runtime-${projectId}`,
        labels: {
          'app.kubernetes.io/project-id': projectId
        }
      },
      spec: {
        podSelector: {
          matchLabels: {
            'app.kubernetes.io/project-id': projectId
          }
        },
        policyTypes: ["Ingress", "Egress"],
        ingress: [{}],
        egress: [
          { to: [{ namespaceSelector: { matchLabels: { name: "kube-system" } } }] },
          { to: [{ podSelector: {} }] }
        ]
      }
    };
    
    await netApi.createNamespacedNetworkPolicy({ namespace: 'default', body: policy });
    return true;
  } catch (error: any) {
    if (error.response?.body?.reason === 'AlreadyExists') {
      return true;
    }
    logger.error('Network policy failed:', error.message);
    return false;
  }
}

async function deleteProjectResources(projectId: string): Promise<boolean> {
  try {
    const { coreApi, appsApi, netApi } = getK8sClient();
    
    await appsApi.deleteNamespacedDeployment({ name: `wonder-runtime-${projectId}`, namespace: 'default' });
    await coreApi.deleteNamespacedService({ name: `wonder-runtime-${projectId}`, namespace: 'default' });
    await coreApi.deleteNamespacedSecret({ name: `wonder-ssh-key-${projectId}`, namespace: 'default' });
    
    try {
      await netApi.deleteNamespacedNetworkPolicy({ name: `wonder-runtime-${projectId}`, namespace: 'default' });
    } catch {}
    
    return true;
  } catch (error) {
    logger.error('Delete failed:', error);
    return false;
  }
}

export {
  createProjectSecret,
  createProjectDeployment,
  createProjectService,
  createNetworkPolicy,
  deleteProjectResources,
  getK8sClient
};