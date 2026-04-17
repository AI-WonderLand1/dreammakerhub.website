// Layout Structure for Spacious Editor
// Room for: Canvas | AI | User Assets | Wiring

/*
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (spacious, not cramped)                                  │
├──────────────────┬──────────────────────────────┬───────────────┤
│                  │                              │               │
│  USER ASSETS     │      INFINITE CANVAS         │    AI         │
│  (Their library) │      (3D Editor)             │   PANEL       │
│                  │                              │   (Confession)│
│  - My Models     │                              │               │
│  - My Scenes     │   [Real PlayCanvas 3D]       │  WonderAI     │
│  - Favorites     │                              │   Chat        │
│                  │   - Pan ∞                    │               │
│  [+ Add from     │   - Zoom ∞                   │   Toggle      │
│   Main Library]  │   - Rotate                   │   (on/off)    │
│                  │                              │               │
├──────────────────┴──────────────────────────────┴───────────────┤
│  BOTTOM: Wiring/Connections Panel (optional, collapsible)       │
└─────────────────────────────────────────────────────────────────┘

SIZING:
- Left Panel (User Assets): 280px (wider for readability)
- Center (Canvas): Flexible, takes remaining space
- Right Panel (AI): 400px (big enough for confession text)
- All text: Readable size (not tiny)
- Buttons: Big enough to click easily
- Padding: Generous, not cramped
*/

// Tailwind classes for this layout:
export const layoutClasses = {
  container: "h-screen flex flex-col bg-black overflow-hidden",
  
  header: "h-20 border-b border-cyan-500/30 p-6 bg-black/50 flex items-center justify-between",
  
  mainContent: "flex-1 flex overflow-hidden",
  
  // Left - User Assets Panel
  assetsPanel: "w-72 border-r border-cyan-500/30 bg-black/30 p-5 overflow-y-auto flex flex-col",
  
  // Center - Infinite Canvas
  canvasArea: "flex-1 relative overflow-hidden",
  
  // Right - AI Panel  
  aiPanel: "w-[420px] border-l border-cyan-500/30 bg-black/50 flex flex-col",
  
  // Bottom - Wiring (collapsible)
  wiringPanel: "h-48 border-t border-cyan-500/30 bg-black/30 p-4",
};
