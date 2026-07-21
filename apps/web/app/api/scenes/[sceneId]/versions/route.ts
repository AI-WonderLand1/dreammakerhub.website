import { NextResponse } from "next/server";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

// Scene version tracking - stores versions in memory/metadata
const sceneVersions: Record<string, Array<{ id: string; version: number; created_at: string }>> = {};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const resolvedParams = await params;
  const { sceneId } = resolvedParams;

  try {
    // For now, generate mock versions based on sceneId pattern
    const versions = sceneVersions[sceneId] || (sceneId.includes("_v") ? [] : [
      { id: sceneId, version: 1, created_at: new Date().toISOString() },
    ]);

    return NextResponse.json({
      versions,
      currentVersion: versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 1,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch versions" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const resolvedParams = await params;
  const { sceneId } = resolvedParams;

  try {
    const body = await request.json();
    const newVersion = body.version;

    if (!sceneVersions[sceneId]) {
      sceneVersions[sceneId] = [];
    }

    sceneVersions[sceneId].push({
      id: `${sceneId}_v${newVersion}`,
      version: newVersion,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save version" },
      { status: 500 }
    );
  }
}