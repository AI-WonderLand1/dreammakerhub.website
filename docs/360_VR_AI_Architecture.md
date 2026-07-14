# 360° Photorealistic VR AI NPC Architecture Blueprint

This document outlines the software engineering structure, data pipeline, and engine wiring required to integrate autonomous AI characters into 360° photorealistic virtual environments (similar to the 360city.com framework).

---

## 1. System Structural Architecture

The architecture is split into three decoupled tiers to ensure optimal VR performance, keeping latency under the critical **1.5-second threshold** for real-time voice interaction.

```
+---------------------------------------------------------------------------------+
| CLIENT LAYER (VR)                                                              |
| [HMD Gaze Tracking] [VAD Microphone Input] [6DoF Controller Prox.]             |
+------------------------------------+----------------------------+---------------+
                                     |                            |
                                     v (Spatial Data)             v (Audio Stream)
+---------------------------------------------------------------------------------+
| SIMULATION ENGINE (WORLD STATE)                                                |
|                                                                                |
| +---------------------------+ +------------------------+ +----------------+    |
| | VISUALS & SCENE           | | INVISIBLE PROXIES      | | NPC AVATAR     |    |
| | [360° Sphere Material]    | | [NavMesh Ground]       | | [IK Looking]   |    |
| | [Hotspot Skybox Swapper]  | | [Gaze Raycast Targets] | | [Lip-Sync]     |    |
| +-------------+-------------+ +-----------+------------+ +-------+--------+    |
|               |                         |                        ^             |
|               +----------------------------+                     |             |
|                                        | (Context Payload)       |             |
+---------------------------------------------|-----------------------|-----------+
                                              v                                   |
+---------------------------------------------------------------------|-----------+
| AI PIPELINE ORCHESTRATOR                                           |               |
|                                                                    |               |
| +-----------------------+ +-----------------------+ +--------+--------+          |
| | INGEST & BUFFER       | | COGNITION ENGINE      | | SYNTHESIS LAYER |          |
| | [Voice-to-Text / STT] |--->| [LLM Persona Prompt] |--->| [TTS Audio Gen] |          |
| | [Context Injector]    | | [Memory DB / Vectors] | | [Viseme Data]    |          |
| +-----------------------+ +-----------------------+ +-----------------+          |
+---------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Components

### A. The Projection Layer (Visuals)
Because 360° environments are flat, equirectangular textures projected onto an inverted sphere or cube-map, the scene lacks native depth. 
* **Texture Inversion:** The engine creates an inverted sphere mesh centered at `(0,0,0)`.
* **The Player Rig:** Fixed permanently at origin `(0,0,0)` for rotation-only movement (3DoF) or limited translation (6DoF) within small, bounded proxy zones.

### B. The Proxy Layer (Spatial Mapping)
To make 3D AI characters look organically anchored inside a flat 2D photograph, you must map **Invisible Spatial Proxies**:
1. **Invisible Shadow Catchers:** Primitive meshes (floors, benches, walls) that match the shapes visible in the 360° image. They use a custom shader that is invisible to the camera but receives dynamic shadows cast by the 3D NPC.
2. **Navigation Meshes (NavMesh):** Bounded walkable areas baked over the invisible floors so the AI character can pathfind smoothly without walking through photographic obstacles.
3. **Gaze Colliders:** Primitive transparent boxes layered over key landmarks in the 360° photo (e.g., historical landmarks, doors, points of interest).

---

## 3. Data Wiring Pipeline

The lifecycle of an interaction loop flows as follows:

```
[User Speech] -> [VAD Capture] -> [gRPC/WebSocket Stream] -> [STT Engine]
                                      |
[Gaze/Proxy Data] -> [JSON Metadata Payload] ----------------------->+
                                      |
                                      v
[Audio & Expression Playback] <- [TTS & Visemes] <- [LLM + Context Fusion]
```

### Data Pipeline Sequence

1. **Sensing Phase (Client):** 
   * Voice Activity Detection (VAD) opens an audio streaming channel over WebSockets/gRPC.
   * A continuous eye/head raycast tracks if the user is looking at an **Invisible Gaze Collider**.
2. **Ingestion Phase (Simulation Engine):**
   * The engine generates an environment state packet on every speech-start trigger.
   ```json
   {
     "session_id": "vr_user_7749",
     "current_scene_id": "old_town_square_04",
     "spatial_context": {
       "user_is_looking_at": "historic_fountain_mesh",
       "npc_distance_meters": 2.1,
       "ambient_light_lux": 150
     }
   }
   ```
3. **Cognition Phase (AI Orchestrator):**
   * Speech-to-Text (STT) decodes the audio payload.
   * The orchestrator appends the updated `spatial_context` straight to the system's runtime memory buffer.
   * The LLM executes a completion pass, parsing persona instructions alongside the live world state.
4. **Synthesis Phase (Execution):**
   * The text completion returns with metadata tags (e.g., `<point_at_fountain> This monument was built in 1742. </point_at_fountain>`).
   * The Text-to-Speech (TTS) engine processes the string and returns a **PCM Audio Buffer** alongside time-stamped **Viseme Blendshape Weights** for real-time lip synchronization.
   * The simulation engine intercepts the `<point_at_fountain>` tag, routes it to the animation state machine, and pipes the audio stream through a spatialized 3D audio source.

---

## 4. Implementation Scripts (Engine Framework)

### A. Context & Environment Controller (C# Template)

Attach this to your scene management layer to switch out visual backgrounds while hot-wiring environmental updates straight to the AI backend.

```csharp
using UnityEngine;
using System.Threading.Tasks;

public class PanoramaAIEnvironmentManager : MonoBehaviour
{
    [Header("Visual Configuration")]
    public Material skyboxSphereMaterial;
    public Transform playerCameraRig;

    [Header("AI Character Configuration")]
    public GameObject npcCharacterInstance;
    public string activeAILocationID;

    /// <summary>
    /// Teleports the player to a new 360 city view and updates the AI context.
    /// </summary>
    public async Task TransitionLocationAsync(Texture2D newPanoramaTexture, string locationName, string architecturalContext, Transform newNPCHomeNode)
    {
        // 1. Swap visual texture smoothly via fade or hard switch
        skyboxSphereMaterial.mainTexture = newPanoramaTexture;
        
        // 2. Snap player rig back to local center of the new dome projection map
        playerCameraRig.position = Vector3.zero;

        // 3. Move the physical NPC model to align with the new photo's perspective layout
        npcCharacterInstance.transform.position = newNPCHomeNode.position;
        npcCharacterInstance.transform.rotation = newNPCHomeNode.rotation;

        // 4. Update the active location ID
        activeAILocationID = locationName;

        // 5. Fire the context update across the data pipeline pipeline to the AI orchestrator
        await SendContextUpdateToAIBackend(locationName, architecturalContext);
    }

    private async Task SendContextUpdateToAIBackend(string location, string context)
    {
        // Structured payload targeting your AI SDK (Inworld SDK, Convai SDK, or custom local pipeline client)
        string payloadJson = $"{{\"location\":\"{location}\", \"description\":\"{context}\"}}";
        
        // Pseudo-code representation of backend API update hook
        // await AIEngineClient.Instance.UpdateSessionContextAsync(payloadJson);
        Debug.Log($"AI Context Wire Synchronized: {payloadJson}");
    }
}
```

### B. VR Gaze Object Tracker (C# Template)

Attach this script to your main VR camera object to inform the AI exactly what the user is inspecting within the flat image.

```csharp
using UnityEngine;

public class VRGazeContextWire : MonoBehaviour
{
    public Transform vrEyeOrigin;
    public float maxGazeDistance = 40f;
    private string lastGazedObject = "";

    void Update()
    {
        RaycastHit hit;
        // Cast an invisible line out from the player's physical headset direction
        if (Physics.Raycast(vrEyeOrigin.position, vrEyeOrigin.forward, out hit, maxGazeDistance))
        {
            // Verify if the raycast collided with an invisible proxy zone
            if (hit.collider.TryGetComponent<InvisibleGazeProxy>(out var proxy))
            {
                if (proxy.proxyObjectName != lastGazedObject)
                {
                    lastGazedObject = proxy.proxyObjectName;
                    NotifyAIEngineOfUserGaze(proxy.proxyObjectName, proxy.associatedMetadata);
                }
            }
        }
        else
        {
            lastGazedObject = "None";
        }
    }

    private void NotifyAIEngineOfUserGaze(string objectName, string context)
    {
        // Pipes current focus to the prompt injector system
        // AIEngineClient.Instance.SetTransientContext($"User is looking at: {objectName} ({context})");
        Debug.Log($"Gaze Pipeline Update -> User focused on: {objectName}");
    }
}

// Simple data wrapper container to place on your invisible collider meshes
public class InvisibleGazeProxy : MonoBehaviour
{
    public string proxyObjectName;
    public string associatedMetadata;
}
```

---

## 5. Deployment Checklist for VR Optimizations

* [ ] **Latency Management:** Use chunked audio streaming (20ms-50ms buffers) instead of sending full voice files to minimize response delays.
* [ ] **Inverse Kinematics (IK):** Wire the NPC's head bone to a `LookAt` target linked directly to the VR camera's position matrix, forcing continuous, realistic eye contact.
* [ ] **Anti-Aliasing:** Use MSAA (4x minimum) inside your engine when rendering 3D avatar meshes inside high-fidelity 360° photographic spheres to eliminate jagged edges.
* [ ] **Audio Spatialization:** Enable HRTF (Head-Related Transfer Function) filtering on the NPC's audio source components so audio pans naturally when the player turns their head.

---

## Integration with DreamMakerHub NPC Sim

This architecture can integrate with the existing `npc-sim` module:

### Mapping Components

| VR Architecture | NPC-Sim Equivalent |
|-----------------|-------------------|
| Cognition Engine (LLM) | `npc-sim/core/decision-layer.ts` |
| World State | `npc-sim/db/schema/npc-sim.ts` (worldState table) |
| NPC Avatar State | `npc-sim/core/types.ts` (NpcState interface) |
| Spatial Context | Extend NpcState with position/scene data |
| Memory DB | `npc-sim/db/schema/npc-sim.ts` (events table) |

### Extension Points

1. **Add Position Tracking** to `NpcState`:
```typescript
export interface NpcState {
  // ... existing fields
  position: { x: number; y: number; z: number };
  currentScene: string;
  gazeTarget: string | null;
}
```

2. **Add VR Event Types** to `EventType`:
```typescript
export type EventType = 
  | 'birth' | 'death' | 'war' | 'alliance' 
  | 'conversion' | 'innovation' | 'dialogue'
  | 'gaze_interaction' | 'voice_command'; // New VR events
```

3. **Wire Speech-to-Text** to the tick loop via the API:
```typescript
// POST /api/sim/voice with transcribed text
app.post('/voice', async (c) => {
  const { text, sessionId, spatialContext } = await c.req.json();
  // Process voice command through decision layer
  // Update NPC state based on LLM response
});
```
