// apps/web/app/api/marketplace/install/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

interface MarketplacePackage {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  github_url: string;
  download_url: string;
  category: string;
  tags: string[];
  install_count: number;
  created_at: string;
  updated_at: string;
}

interface InstallRequest {
  packageId: string;
  projectId?: string;
  version?: string;
}

interface InstallRecord {
  id: string;
  user_id: string;
  package_id: string;
  project_id: string | null;
  version: string;
  installed_at: string;
}

/**
 * Marketplace install route with Supabase integration
 */
export async function POST(req: NextRequest) {
  const traceId = crypto.randomUUID();
  
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn("Marketplace install unauthorized", { traceId });
      return NextResponse.json({ 
        ok: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const body: InstallRequest = await req.json().catch(() => ({}));
    const { packageId, projectId, version = "latest" } = body;

    if (!packageId) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing packageId",
        traceId 
      }, { status: 400 });
    }

    // 1. Fetch package details from marketplace
    const { data: packageData, error: packageError } = await supabase
      .from("marketplace_packages")
      .select("*")
      .eq("id", packageId)
      .single();

    if (packageError || !packageData) {
      logger.error("Package not found", { packageId, traceId, error: packageError });
      return NextResponse.json({ 
        ok: false, 
        error: "Package not found",
        traceId 
      }, { status: 404 });
    }

    const packageInfo = packageData as MarketplacePackage;

    // 2. Record installation
    const installRecord: Omit<InstallRecord, "id"> = {
      user_id: user.id,
      package_id: packageId,
      project_id: projectId || null,
      version,
      installed_at: new Date().toISOString(),
    };

    const { data: installData, error: installError } = await supabase
      .from("marketplace_installs")
      .insert(installRecord)
      .select()
      .single();

    if (installError) {
      logger.error("Failed to record installation", { 
        packageId, 
        userId: user.id, 
        traceId, 
        error: installError 
      });
      return NextResponse.json({ 
        ok: false, 
        error: "Failed to record installation",
        traceId 
      }, { status: 500 });
    }

    // 3. Update install count
    const { error: updateError } = await supabase
      .from("marketplace_packages")
      .update({ 
        install_count: (packageInfo.install_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", packageId);

    if (updateError) {
      logger.warn("Failed to update install count", { 
        packageId, 
        traceId, 
        error: updateError 
      });
      // Continue despite this error - installation was recorded
    }

    // 4. Log successful installation
    logger.info("Marketplace package installed", {
      packageId,
      packageName: packageInfo.name,
      userId: user.id,
      projectId,
      version,
      traceId
    });

    return NextResponse.json({
      ok: true,
      message: `Package "${packageInfo.name}" installed successfully`,
      package: {
        id: packageInfo.id,
        name: packageInfo.name,
        version,
        author: packageInfo.author,
        installedAt: installData.installed_at,
      },
      traceId
    }, { status: 200 });

  } catch (error: any) {
    logger.error("Marketplace install error", { 
      traceId, 
      error: error.message,
      stack: error.stack 
    });
    
    return NextResponse.json({ 
      ok: false, 
      error: "Internal server error",
      traceId 
    }, { status: 500 });
  }
}
