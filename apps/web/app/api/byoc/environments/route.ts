import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type CloudProvider = "aws" | "gcp" | "azure";

type ByocEnvironment = {
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

type IncomingEnvironment = {
  tenantName?: string;
  provider?: CloudProvider;
  region?: string;
  projectOrAccountId?: string;
  roleArn?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const ENVIRONMENTS_FILE = path.join(DATA_DIR, "byoc-environments.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(ENVIRONMENTS_FILE);
  } catch {
    await fs.writeFile(ENVIRONMENTS_FILE, JSON.stringify([], null, 2), "utf8");
  }
}

async function readEnvironments(): Promise<ByocEnvironment[]> {
  await ensureDataFile();
  const raw = await fs.readFile(ENVIRONMENTS_FILE, "utf8");
  return JSON.parse(raw) as ByocEnvironment[];
}

async function writeEnvironments(environments: ByocEnvironment[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(ENVIRONMENTS_FILE, JSON.stringify(environments, null, 2), "utf8");
}

function validatePayload(body: IncomingEnvironment): string | null {
  if (!body.tenantName?.trim()) return "Tenant name is required";
  if (!body.provider || !["aws", "gcp", "azure"].includes(body.provider)) return "Provider must be aws, gcp, or azure";
  if (!body.region?.trim()) return "Region is required";
  if (!body.projectOrAccountId?.trim()) return "Project/account id is required";
  if (!body.roleArn?.trim()) return "Role ARN or workload identity principal is required";
  return null;
}

function createEnvironment(body: IncomingEnvironment): ByocEnvironment {
  const now = new Date().toISOString();
  return {
    id: `byoc-${Date.now()}`,
    tenantName: body.tenantName?.trim() ?? "",
    provider: body.provider as CloudProvider,
    region: body.region?.trim() ?? "",
    projectOrAccountId: body.projectOrAccountId?.trim() ?? "",
    roleArn: body.roleArn?.trim() ?? "",
    status: "connected",
    createdAt: now,
    updatedAt: now,
  };
}

export async function GET() {
  try {
    const environments = await readEnvironments();
    return NextResponse.json({ environments });
  } catch {
    return NextResponse.json({ error: "Failed to load BYOC environments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IncomingEnvironment;
    const validationError = validatePayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const environments = await readEnvironments();
    const environment = createEnvironment(body);
    environments.unshift(environment);
    await writeEnvironments(environments);

    return NextResponse.json({ environment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save BYOC environment" }, { status: 500 });
  }
}
