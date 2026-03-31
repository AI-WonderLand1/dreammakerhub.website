import { Client } from "colyseus.js";

export type CloudProvider = "aws" | "gcp" | "azure";

export type ByocEnvironment = {
  id: string;
  tenantName: string;
  provider: CloudProvider;
  region: string;
  projectOrAccountId: string;
  roleArn: string;
  status: "connected";
  createdAt: string;
  updatedAt: string;
};

export type IncomingByocEnvironment = {
  tenantName: string;
  provider: CloudProvider;
  region: string;
  projectOrAccountId: string;
  roleArn: string;
};

const STORAGE_KEY = "wonder:byoc:environments";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function connectClient() {
  const endpoint = process.env.NEXT_PUBLIC_COLYSEUS_URL?.trim();
  if (!endpoint) return null;
  try {
    return new Client(endpoint);
  } catch {
    return null;
  }
}

export function validateByocEnvironment(payload: IncomingByocEnvironment): string | null {
  if (!payload.tenantName.trim()) return "Tenant name is required";
  if (!["aws", "gcp", "azure"].includes(payload.provider)) return "Provider must be aws, gcp, or azure";
  if (!payload.region.trim()) return "Region is required";
  if (!payload.projectOrAccountId.trim()) return "Project/account id is required";
  if (!payload.roleArn.trim()) return "Role ARN or workload identity principal is required";
  return null;
}

export async function listByocEnvironments(): Promise<ByocEnvironment[]> {
  if (!canUseStorage()) return [];
  connectClient();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ByocEnvironment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveByocEnvironment(payload: IncomingByocEnvironment): Promise<ByocEnvironment> {
  const validationError = validateByocEnvironment(payload);
  if (validationError) {
    throw new Error(validationError);
  }
  if (!canUseStorage()) {
    throw new Error("BYOC storage is not available in this environment");
  }

  connectClient();

  const current = await listByocEnvironments();
  const now = new Date().toISOString();

  const environment: ByocEnvironment = {
    id: `byoc-${Date.now()}`,
    tenantName: payload.tenantName.trim(),
    provider: payload.provider,
    region: payload.region.trim(),
    projectOrAccountId: payload.projectOrAccountId.trim(),
    roleArn: payload.roleArn.trim(),
    status: "connected",
    createdAt: now,
    updatedAt: now,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([environment, ...current]));
  return environment;
}
