import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from "@/lib/auth";
import { logger } from '@/lib/logger';

interface CreateProjectRequest {
  projectName: string;
  projectType: 'webgl' | 'playcanvas' | 'custom';
}

interface CreateProjectResponse {
  success: boolean;
  message: string;
  workspaceId?: string;
  accessUrl?: string;
  status?: string;
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as CreateProjectRequest;
    const { projectName, projectType } = body;

    if (!projectName || !projectName.trim()) {
      return NextResponse.json(
        { success: false, message: 'Project name is required' },
        { status: 400 }
      );
    }

    // Validate project type
    const validTypes = ['webgl', 'playcanvas', 'custom'];
    if (!validTypes.includes(projectType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid project type' },
        { status: 400 }
      );
    }

    // Generate a workspace ID
    const workspaceId = `ws_${projectType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build the access URL - this should point to your custom 3D runtime
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const accessUrl = `${baseUrl}/3d/${workspaceId}`;

    // Map project type to template
    const templateMap: Record<string, string> = {
      webgl: 'webgl-editor-v2',
      playcanvas: 'playcanvas-game-engine',
      custom: 'custom-3d-ide',
    };

    return NextResponse.json({
      success: true,
      message: `${projectType.charAt(0).toUpperCase() + projectType.slice(1)} project created successfully`,
      workspaceId,
      accessUrl,
      status: 'creating',
      template: templateMap[projectType],
    });
  } catch (error) {
    logger.error('Error creating 3D project:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
