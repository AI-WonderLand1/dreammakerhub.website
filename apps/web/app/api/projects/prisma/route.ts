import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { getSmokeUserIdFromRequest } from "@/lib/smokeAuth";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const smokeUserId = getSmokeUserIdFromRequest(req);

    if (!user && !smokeUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownerId = smokeUserId ?? user!.id;

    const projects = await prisma.projects.findMany({
      where: { user_id: ownerId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        thumbnail_url: true,
        is_public: true,
        created_at: true,
        updated_at: true,
      }
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    logger.error("Error fetching projects:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}