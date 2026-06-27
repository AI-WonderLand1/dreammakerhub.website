# WonderBuild Studio - Unified Builder Interface

## Overview
Merge Preview, Puck, and AI Assistant into a single studio interface with:
- Left panel: Draggable components library (all blocks)
- Center: Infinite canvas (Puck editor)
- Top bar: View toggles (Preview/Code) + AI Assistant button
- Bottom bar: Status
- AI Assistant: Pop-up modal from top bar button

## Current State
- `/wonder-build/puck` - Visual drag-drop editor
- `/wonder-build/preview` - Live preview panel  
- `/wonder-build/ai-builder` - Prompt-to-code AI flow
- `/wonder-build/agent` - Agent activity/logs panel
- PlayCanvas & Spatial builders remain separate (untouched)

## Implementation Plan

### Phase 1: Unified Studio Layout
- [ ] Create `/wonder-build/studio` route (enhance `/puck` or new route)
- [ ] Layout structure:
  - Fixed top bar (48px height)
  - Resizable left panel (min-width: 240px, collapsible)
  - Flexible center canvas (remaining space, infinite)
  - Fixed bottom bar (32px height)
- [ ] Implement infinite canvas (PuckEditorClient with height: 100%)

### Phase 2: Left Panel - Component Library
- [ ] Create `ComponentsLibrary.tsx` with:
  - Search/filter functionality
  - Category grouping (Layout, Media, Forms, AI, etc.)
  - Drag preview with hover effects
  - All Puck blocks available for drag-and-drop
- [ ] Configure Puck editor to accept drops from library
- [ ] Include collapse/expand toggle (arrow button)

### Phase 3: Top Bar - View System
- [ ] Replace preview panel with top bar controls:
  - `[Visual]` button → sets `editorMode = "visual"` (default)
  - `[Preview]` button → sets `editorMode = "preview"` (iframe)
  - `[Code]` button → sets `editorMode = "code"` (JSON/React export)
  - `[AI Assist]` button → opens AI Assistant modal (popup)
- [ ] Modify PuckEditorClient to accept `viewMode` prop and switch modes
- [ ] Preserve canvas state when switching views

### Phase 4: AI Assistant Modal
- [ ] Create `AIAssistantModal.tsx` triggered by top bar button:
  - Prompt input with examples
  - Build type selector (website/game/component/3d-asset)
  - Agent activity log (architect→builder→reviewer stages)
  - "Accept to Puck" button
  - "Stop build" button
  - Confessions/internal reasoning display
- [ ] Implement AI-to-Puck flow:
  1. User enters prompt + selects type
  2. Send to `/api/build/stream` with abort signal support
  3. Receive HTML → convert via `htmlToPuckBlocks` → `storePuckData`
  4. Redirect to `/wonder-build/studio?ai_data={key}`
  5. Auto-load AI-generated content into Puck editor

### Phase 5: Bottom Bar - Status & Export
- [ ] Create compact status bar showing:
  - Build status (idle/building/complete/error)
  - Current view mode indicator
  - Project name/save status
  - Quick export buttons (HTML/JSON/React)
  - AI generation progress (when active)
- [ ] Preserve existing export/Puck-to-platform functionality

### Phase 6: Polish & Cleanup
- [ ] Add keyboard shortcuts:
  - `Ctrl+1` → Visual view
  - `Ctrl+2` → Preview view  
  - `Ctrl+3` → Code view
  - `Ctrl+Shift+A` → Toggle AI Assistant
  - `Ctrl+Shift+L` → Toggle left panel
- [ ] Ensure dark/light theme consistency
- [ ] Test infinite canvas behavior with large projects
- [ ] Verify drag-and-drop works for all block types
- [ ] Confirm AI generation doesn't break existing projects

### Route Changes (After Implementation)
- `/wonder-build/preview` → 301 redirect to `/wonder-build/studio`
- `/wonder-build/ai-builder` → 301 redirect to `/wonder-build/studio`  
- `/wonder-build/agent` → 301 redirect to `/wonder-build/studio`
- `/wonder-build/puck` → 301 redirect to `/wonder-build/studio` (or keep as alias)
- `/wonder-build/playcanvas` → UNCHANGED
- `/wonder-build/spatial` → UNCHANGED

## Risk Mitigation
- [ ] Create backup branch before starting
- [ ] Test each builder independently after integration
- [ ] Validate AI generation with abort/cancel functionality
- [ ] Test left panel drag/drop with all block types
- [ ] Verify view mode switching preserves editor state
- [ ] Check keyboard shortcuts don't conflict with browser defaults

## Open Questions
1. Should we keep `/wonder-build/puck` as the main route or use `/wonder-build/studio`?
2. Should the AI Assistant modal remember last prompt/type between openings?
3. Should preview mode show iframe or use Puck's internal preview?
4. What should be the default view mode on first load?

---
*Generated from WonderBuild Builder Integration Plan*
*Timestamp: 2026-06-27* planning.md