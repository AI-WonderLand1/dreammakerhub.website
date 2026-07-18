# PlayCanvas Gesture Bridge Integration

## Overview
Connects the gesture-engine spatial system to any PlayCanvas scene. All rendering is client-side WebGL — zero server GPU required.

## How to Integrate

### 1. Import the bridge in your PlayCanvas editor page

```tsx
import { PlayCanvasGestureBridge } from '@dreammakerhub/gesture-engine/bridge/playcanvas'
```

### 2. Instantiate after your PlayCanvas app is ready

```tsx
const gestureBridgeRef = useRef<PlayCanvasGestureBridge | null>(null)

// After PlayCanvas app initializes:
useEffect(() => {
  if (!app || !canvas) return

  const bridge = new PlayCanvasGestureBridge(app, {
    enabled: true,
    sensitivity: 1.0,
    smoothing: 0.85,
  })

  bridge.attach(canvas)
  gestureBridgeRef.current = bridge

  return () => {
    bridge.destroy()
    gestureBridgeRef.current = null
  }
}, [app, canvas])
```

### 3. Set a target entity (optional)

By default the bridge manipulates the first `render` component or camera it finds. To target a specific entity:

```tsx
const myEntity = app.root.findByName('MyObject')
gestureBridgeRef.current?.setTarget(myEntity)
```

### 4. Listen for gesture events (optional)

```tsx
// Poll last event in an animation loop or useEffect
const lastEvent = gestureBridgeRef.current?.lastKnownEvent
if (lastEvent && lastEvent.confidence > 0.5) {
  console.log('Gesture:', lastEvent.gesture)
  console.log('Rotation:', lastEvent.rotation)
}
```

### 5. Toggle on/off

```tsx
gestureBridgeRef.current?.enable()
gestureBridgeRef.current?.disable()
```

## Gesture Controls

| Gesture | Mouse/Touch Input | 3D Effect |
|---------|------------------|-----------|
| Swipe | Drag in one direction | Rotate camera or move object along swipe axis |
| Wave | Oscillating motion (direction reversal 2+) | Scale object pulsing with amplitude |
| Click/Hold | Hold and hold still | Select mode (future) |

## Architecture

```
Input (mouse/touch)
  ↓
MotionSample[] buffer (gesture-engine)
  ↓
IntentDetector.evaluate()  → filters incidental movement
  ↓
classifyLateralMotion()   → wave / swipe / none
  ↓
computeSpatialTransform() → { position, rotation, scale }
  ↓
applyToScene()            → pc.Application entity manipulation
```

## Zero Server GPU Required

All of this runs in the browser:
- Input capture → event listeners
- Gesture classification → CPU math (no GPU)
- 3D rendering → PlayCanvas WebGL (client GPU, not server)
- Transform application → JavaScript on the main thread

The server only serves static files and optional API for saving scenes.
