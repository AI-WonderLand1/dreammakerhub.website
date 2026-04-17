# PlayCanvas Isolation Template

## Overview
WebContainer-based architecture for private, per-user PlayCanvas/WebGL environments.

## Directory Structure
```
/playcanvas-isolation/
├── client/           # Browser-side components
│   ├── IsolatedPlayCanvas.tsx  # Main React component
│   └── PlayCanvasClient.ts     # WebContainer client
├── webcontainer/     # WebContainer management
│   └── PlayCanvasContainer.ts  # Per-user container manager
├── service-worker/   # Request routing
│   └── playcanvas-sw.ts        # User-based routing
├── types/           # TypeScript definitions
├── utils/           # Utility functions
└── index.ts         # Main exports
```

## Quick Start

### 1. Basic Usage
```tsx
import { IsolatedPlayCanvas } from '@/components/playcanvas-isolation';

function MyComponent() {
  return (
    <IsolatedPlayCanvas
      userId="user-123"
      sceneId="my-scene"
      onReady={() => console.log('Ready')}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

### 2. With Hook
```tsx
import { useIsolatedPlayCanvas } from '@/components/playcanvas-isolation';

function MyComponent() {
  const { client, isReady, error } = useIsolatedPlayCanvas('user-123', 'scene-1');
  
  if (!isReady) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>PlayCanvas ready</div>;
}
```

### 3. Demo Page
Visit `/playcanvas-isolated` to see the template in action.

## Architecture

### Service Worker
- Intercepts requests to `/playcanvas-isolated/*`
- Routes to user-specific WebContainer instances
- Manages caching and request coalescing

### WebContainer Manager
- Creates isolated WebContainer per user
- Manages virtual filesystem (`/users/{hashed-id}/`)
- Handles cleanup and resource management

### PlayCanvas Client
- Loads PlayCanvas editor from container server
- Manages scene loading/saving
- Provides WebGL context bridge

## Features

✅ **True Per-User Isolation** - Each user gets their own WebContainer
✅ **Filesystem Isolation** - Virtual paths based on hashed user IDs  
✅ **Service Worker Routing** - Automatic request routing by user
✅ **Demo Mode** - Graceful fallback when WebContainer isn't available
✅ **Production Ready** - Error handling, status monitoring, cleanup

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_PLAYCANVAS_ISOLATION_ENABLED=true
```

### Service Worker Registration
```tsx
import { registerPlayCanvasServiceWorker } from '@/components/playcanvas-isolation';

// In your app initialization
registerPlayCanvasServiceWorker();
```

## API Endpoints

### GET /api/playcanvas-isolation
- `action=status` - Get container manager status
- `action=container` - Get user's container

### POST /api/playcanvas-isolation
- `action=create_scene` - Create new scene
- `action=mount_files` - Mount files to container
- `action=destroy_container` - Destroy user's container

## TypeScript Types

```typescript
interface IsolatedPlayCanvasProps {
  userId: string;
  sceneId?: string;
  className?: string;
  style?: React.CSSProperties;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: string) => void;
}

interface UserSession {
  userId: string;
  email?: string;
  hashedId: string;
  token: string;
  expiresAt: number;
}
```

## Troubleshooting

### WebContainer Not Available
The component includes demo mode for environments where WebContainer isn't available (e.g., missing SharedArrayBuffer).

### Build Errors
Ensure `playcanvas` is in your dependencies:
```json
{
  "dependencies": {
    "playcanvas": "^2.17.0"
  }
}
```

## Next Steps

1. **Integration**: Add the component to your app
2. **Authentication**: Connect to your auth system
3. **Production**: Configure service worker in production
4. **Scaling**: Adjust `maxInstances` based on usage