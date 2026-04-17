import { NextResponse } from 'next/server';
import { PlayCanvasContainerManager } from '@/components/playcanvas-isolation/webcontainer/PlayCanvasContainer';
import { getCurrentUserSession } from '@/components/playcanvas-isolation/utils/auth';
import type { IsolationConfig } from '@/components/playcanvas-isolation/types/isolation';

// Singleton container manager (would be managed differently in production)
let containerManager: PlayCanvasContainerManager | null = null;

function getContainerManager(): PlayCanvasContainerManager {
  if (!containerManager) {
    const config: IsolationConfig = {
      maxInstances: 10,
      instanceTimeoutMs: 30 * 60 * 1000, // 30 minutes
      enableCaching: true,
      cacheSizeMB: 100,
      cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
    };
    
    containerManager = new PlayCanvasContainerManager(
      config.maxInstances,
      config.instanceTimeoutMs,
      config.cleanupIntervalMs
    );
  }
  
  return containerManager;
}

export async function GET(request: Request) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const manager = getContainerManager();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return NextResponse.json({
          instanceCount: manager.getInstanceCount(),
          activeInstances: manager.getActiveInstances().length,
          maxInstances: 10,
        });

      case 'container':
        const instance = await manager.getContainer(userSession.userId);
        return NextResponse.json({
          containerId: instance.id,
          serverUrl: instance.serverUrl,
          isActive: instance.isActive,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, container' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] Error in GET /api/playcanvas-isolation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, sceneId, files } = body;

    const manager = getContainerManager();

    switch (action) {
      case 'create_scene':
        if (!sceneId) {
          return NextResponse.json(
            { error: 'sceneId is required' },
            { status: 400 }
          );
        }

        const instance = await manager.getContainer(userSession.userId);
        const scenePath = `/scenes/${sceneId}.json`;
        
        const defaultScene = {
          name: `Scene ${sceneId}`,
          version: '1.0',
          objects: [],
          lights: [],
          camera: {
            position: [0, 5, 10],
            target: [0, 0, 0],
            fov: 45,
          },
        };

        await instance.container.fs.writeFile(
          scenePath,
          JSON.stringify(defaultScene, null, 2)
        );

        return NextResponse.json({
          success: true,
          sceneId,
          containerId: instance.id,
        });

      case 'mount_files':
        if (!files || typeof files !== 'object') {
          return NextResponse.json(
            { error: 'files object is required' },
            { status: 400 }
          );
        }

        const fileInstance = await manager.getContainer(userSession.userId);
        await fileInstance.container.mount(files);

        return NextResponse.json({
          success: true,
          containerId: fileInstance.id,
        });

      case 'destroy_container':
        await manager.destroyContainer(`pc-container-${userSession.hashedId}`);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create_scene, mount_files, destroy_container' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] Error in POST /api/playcanvas-isolation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const manager = getContainerManager();
    const { searchParams } = new URL(request.url);
    const containerId = searchParams.get('containerId');

    if (!containerId) {
      return NextResponse.json(
        { error: 'containerId is required' },
        { status: 400 }
      );
    }

    await manager.destroyContainer(containerId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error in DELETE /api/playcanvas-isolation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}