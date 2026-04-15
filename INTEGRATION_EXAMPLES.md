// Example: Integrating PlayCanvas Isolation into your existing app

// 1. Basic Integration in a Page Component
// ========================================

// File: apps/web/app/editor/page.tsx
"use client";

import { IsolatedPlayCanvas } from '@/components/playcanvas-isolation';
import { useAuth } from '@/lib/auth-context';

export default function EditorPage() {
  const { user } = useAuth();
  
  if (!user) {
    return <div>Please log in to access the editor</div>;
  }
  
  return (
    <div className="h-screen">
      <IsolatedPlayCanvas 
        userId={user.id}
        sceneId="default-scene"
        className="h-full"
        onReady={() => console.log('Editor ready for user:', user.id)}
        onError={(error) => console.error('Editor error:', error)}
      />
    </div>
  );
}

// 2. Advanced Integration with Multiple Scenes
// ============================================

// File: apps/web/app/projects/[projectId]/page.tsx
"use client";

import { useState } from 'react';
import { IsolatedPlayCanvas } from '@/components/playcanvas-isolation';
import { useAuth } from '@/lib/auth-context';

interface Project {
  id: string;
  name: string;
  scenes: string[];
}

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const [currentScene, setCurrentScene] = useState<string>('main');
  const [project, setProject] = useState<Project | null>(null);
  
  // Load project data
  useEffect(() => {
    fetch(`/api/projects/${params.projectId}`)
      .then(res => res.json())
      .then(setProject);
  }, [params.projectId]);
  
  if (!user || !project) return <div>Loading...</div>;
  
  return (
    <div className="flex h-screen">
      {/* Scene selector */}
      <div className="w-64 bg-gray-900 p-4">
        <h3 className="text-white mb-4">Scenes</h3>
        {project.scenes.map(scene => (
          <button
            key={scene}
            onClick={() => setCurrentScene(scene)}
            className={`w-full text-left p-2 mb-2 rounded ${
              currentScene === scene ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'
            }`}
          >
            {scene}
          </button>
        ))}
      </div>
      
      {/* Editor */}
      <div className="flex-1">
        <IsolatedPlayCanvas 
          userId={user.id}
          sceneId={`${params.projectId}/${currentScene}`}
          className="h-full"
          onReady={() => console.log(`Scene ${currentScene} ready`)}
          onError={(error) => console.error('Scene error:', error)}
          onStatusChange={(status) => console.log('Status:', status)}
        />
      </div>
    </div>
  );
}

// 3. Using the Hook for Advanced Control
// ======================================

// File: apps/web/components/AdvancedEditor.tsx
"use client";

import { useIsolatedPlayCanvas } from '@/components/playcanvas-isolation';
import { useAuth } from '@/lib/auth-context';

export function AdvancedEditor({ sceneId }: { sceneId: string }) {
  const { user } = useAuth();
  const { client, isReady, error } = useIsolatedPlayCanvas(user?.id || '', sceneId);
  
  if (!user) return <div>Authentication required</div>;
  if (!isReady) return <div>Loading editor...</div>;
  if (error) return <div>Error: {error}</div>;
  
  // You can now use the client directly for advanced operations
  const saveScene = async (sceneData: any) => {
    if (client) {
      await client.saveScene(sceneId, sceneData);
    }
  };
  
  const loadAsset = async (assetPath: string) => {
    if (client) {
      return await client.readFile(assetPath);
    }
  };
  
  return (
    <div>
      <div>Editor ready for user {user.id}</div>
      {/* Your custom editor UI */}
    </div>
  );
}

// 4. Server-Side Integration (API Routes)
// ======================================

// File: apps/web/app/api/projects/[projectId]/scenes/route.ts
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get scenes for project (using isolation system)
  const scenePath = `/users/${user.id}/projects/${params.projectId}/scenes/`;
  
  // Implementation would use WebContainer or database
  return NextResponse.json({
    scenes: ['main', 'level1', 'level2'],
    projectId: params.projectId,
    userId: user.id,
  });
}

// 5. Environment Configuration
// ===========================

// File: .env.local
/*
# PlayCanvas Isolation Configuration
NEXT_PUBLIC_PLAYCANVAS_ISOLATION_ENABLED=true

# WebContainer Settings (production)
PLAYCANVAS_MAX_INSTANCES=50
PLAYCANVAS_INSTANCE_TIMEOUT=1800000
PLAYCANVAS_CACHE_SIZE=200

# Security
NEXT_PUBLIC_ALLOWED_ORIGINS=https://yourdomain.com
*/

// 6. Service Worker Registration
// ==============================

// File: apps/web/app/layout.tsx
"use client";

import { useEffect } from 'react';
import { registerPlayCanvasServiceWorker } from '@/components/playcanvas-isolation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker for PlayCanvas isolation
    if (typeof window !== 'undefined') {
      registerPlayCanvasServiceWorker().then(registration => {
        if (registration) {
          console.log('PlayCanvas isolation service worker registered');
        }
      });
    }
  }, []);
  
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// 7. Testing Example
// =================

// File: apps/web/__tests__/playcanvas-isolation.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { IsolatedPlayCanvas } from '@/components/playcanvas-isolation';

describe('IsolatedPlayCanvas', () => {
  it('renders without crashing', async () => {
    render(
      <IsolatedPlayCanvas 
        userId="test-user-123"
        sceneId="test-scene"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/PlayCanvas Isolated/i)).toBeInTheDocument();
    });
  });
  
  it('shows demo mode when WebContainer unavailable', async () => {
    // Mock WebContainer unavailability
    render(
      <IsolatedPlayCanvas 
        userId="test-user-123"
        sceneId="test-scene"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Demo mode/i)).toBeInTheDocument();
    });
  });
});

// 8. Custom Configuration Example
// ===============================

// File: apps/web/components/CustomPlayCanvasEditor.tsx
"use client";

import { IsolatedPlayCanvas } from '@/components/playcanvas-isolation';

interface CustomEditorProps {
  userId: string;
  sceneId: string;
  config?: {
    maxInstances?: number;
    enableCaching?: boolean;
    theme?: 'dark' | 'light';
  };
}

export function CustomPlayCanvasEditor({ 
  userId, 
  sceneId, 
  config = {} 
}: CustomEditorProps) {
  const {
    maxInstances = 10,
    enableCaching = true,
    theme = 'dark'
  } = config;
  
  return (
    <div className={`editor-theme-${theme}`}>
      <IsolatedPlayCanvas 
        userId={userId}
        sceneId={sceneId}
        className="custom-editor"
        onReady={() => {
          console.log('Custom editor ready');
          // Additional setup
        }}
        onError={(error) => {
          console.error('Custom editor error:', error);
          // Custom error handling
        }}
        onStatusChange={(status) => {
          console.log('Custom editor status:', status);
          // Custom status handling
        }}
      />
    </div>
  );
}