import { logger } from '@/lib/logger';
/**
 * Builder Routing Strategy
 *
 * All builder surfaces consolidated under /wonder-build/*:
 *
 *   /wonder-build             → Main hub (SovereignOS shell)
 *   /wonder-build/ai-builder  → AI builder (websites, games, 3D assets)
 *   /wonder-build/playcanvas  → 3D scene editor (PlayCanvas)
 *   /wonder-build/puck        → Visual drag-drop builder (Puck)
 *   /wonder-build/3d          → WebGL Studio
 *   /wonder-build/spatial     → Spatial Designer (embed of external or future integration)
 *
 * Legacy redirects (preserved for backward compatibility):
 *   /builder         → QuadEngineShell (legacy multi-engine UI)
 *   /builder-ai      → redirect → /wonder-build
 *   /builder/3d      → WebGL Studio (standalone)
 *   /builder/[id]    → redirect → /wonder-build?blueprint={id}
 *
 * Auth: AuthProvider at root layout wraps all surfaces.
 */

export const metadata = { title: 'Builder — AI Wonderland' };

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
