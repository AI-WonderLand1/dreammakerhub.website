import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { encryptByocCredentials, type ByocCredentialPayload } from "@/lib/crypto/byoc";

export const runtime = "nodejs";

type CloudProvider = "s3" | "gcs" | "azure" | "r2" | "supabase";
type AuthMode = "apiKey" | "oauth";
type CloudConnectionStatus = "connected" | "disconnected";

type CloudConnectionRow = {
  id: string;
  user_id: string;
  name: string;
  provider: CloudProvider;
  bucket_or_container: string;
  region: string | null;
  auth_mode: AuthMode;
  credentials_ciphertext: string;
  credentials_iv: string;
  credentials_tag: string;
  credentials_alg: string;
  credentials_meta: Record<string, string | null>;
  status: CloudConnectionStatus;
  connected_at: string;
  disconnected_at: string | null;
  last_reconnected_at: string | null;
  created_at: string;
  updated_at: string;
};

type CloudConnection = {
  id: string;
  name: string;
  provider: CloudProvider;
  bucketOrContainer: string;
  region: string | null;
  authMode: AuthMode;
  status: CloudConnectionStatus;
  connectedAt: string;
  disconnectedAt: string | null;
  lastReconnectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  credentialsMetadata: Record<string, string | null>;
};

type IncomingConnection = {
  name?: string;
  provider?: CloudProvider;
  bucketOrContainer?: string;
  region?: string | null;
  authMode?: AuthMode;
  credentials?: ByocCredentialPayload;
};

function providerNeedsRegion(provider: CloudProvider) {
  return provider === "s3" || provider === "gcs";
}

function normalizeCloudConnection(row: CloudConnectionRow): CloudConnection {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    bucketOrContainer: row.bucket_or_container,
    region: row.region,
    authMode: row.auth_mode,
    status: row.status,
    connectedAt: row.connected_at,
    disconnectedAt: row.disconnected_at,
    lastReconnectedAt: row.last_reconnected_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    credentialsMetadata: row.credentials_meta,
  };
}

function validatePayload(body: IncomingConnection): string | null {
  if (!body.name?.trim()) return "Connection name is required";
  if (!body.provider || !["s3", "gcs", "azure", "r2", "supabase"].includes(body.provider)) {
    return "Provider must be s3, gcs, azure, r2, or supabase";
  }
  if (!body.bucketOrContainer?.trim()) return "Bucket or container is required";
  if (!body.authMode || !["apiKey", "oauth"].includes(body.authMode)) {
    return "Auth mode must be apiKey or oauth";
  }
  if (providerNeedsRegion(body.provider) && !body.region?.trim()) {
    return "Region is required for this provider";
  }
  if (!body.credentials || Object.keys(body.credentials).length === 0) {
    return "Credentials are required";
  }
  return null;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("cloud_connections")
      .select(
        "id,user_id,name,provider,bucket_or_container,region,auth_mode,credentials_ciphertext,credentials_iv,credentials_tag,credentials_alg,credentials_meta,status,connected_at,disconnected_at,last_reconnected_at,created_at,updated_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ connections: (data ?? []).map((row) => normalizeCloudConnection(row as CloudConnectionRow)) });
  } catch {
    return NextResponse.json({ error: "Failed to load cloud connections" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as IncomingConnection;
    const validationError = validatePayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const now = new Date().toISOString();
    const encryptedCredentials = encryptByocCredentials(body.credentials ?? {});

    const insertPayload = {
      user_id: user.id,
      name: body.name?.trim() ?? "",
      provider: body.provider as CloudProvider,
      bucket_or_container: body.bucketOrContainer?.trim() ?? "",
      region: body.region?.trim() || null,
      auth_mode: body.authMode as AuthMode,
      ...encryptedCredentials,
      status: "connected" as const,
      connected_at: now,
      disconnected_at: null,
      last_reconnected_at: null,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("cloud_connections")
      .insert(insertPayload)
      .select(
        "id,user_id,name,provider,bucket_or_container,region,auth_mode,credentials_ciphertext,credentials_iv,credentials_tag,credentials_alg,credentials_meta,status,connected_at,disconnected_at,last_reconnected_at,created_at,updated_at",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ connection: normalizeCloudConnection(data as CloudConnectionRow) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save cloud connection" }, { status: 500 });
  }
}
