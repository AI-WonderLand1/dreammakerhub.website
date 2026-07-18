export interface VClusterPodOptions {
  name: string
  cpu: number
  memory: string
  gpu?: number
  image: string
  ports: number[]
  env: Record<string, string>
  repoUrl?: string
}

export interface VClusterPodStatus {
  name: string
  namespace: string
  status: 'pending' | 'running' | 'failed' | 'stopped'
  nodeIp?: string
  ports: { container: number; node: number }[]
  createdAt: string
  gpuAllocated?: number
}

export interface VClusterProvisionResult {
  success: boolean
  pod?: VClusterPodStatus
  error?: string
}

export interface VClusterConfig {
  namespace: string
  clusterName: string
  gpuNodeSelector?: string
  storageClass?: string
}