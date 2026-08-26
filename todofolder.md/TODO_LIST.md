# TODO List for DreamMakerHub Website

## High Priority
- [ ] Implement Google AI model fetching in `apps/web/app/api/ai/modules/route.ts`
  - Currently returns empty array due to TODO comment
  - Need to implement actual fetching from Google AI API
  - This affects the AI Modules page functionality

## Low Priority / Considerations
- [ ] Consider removing or making conditional the console.log in `apps/web/lib/builder/pipeline/CodeGenerationService.ts`
  - Currently: `console.log("[Builder] Project loaded",new Date().toISOString());`
  - This is used for debugging but may not be needed in production
  - Could wrap in `if (process.env.NODE_ENV !== 'production')` check

## Completed Fixes
- [x] Fixed all href="#" broken links:
  - Sidebar navigation items (AI Tools, 3D Generator, Print Tools, Creations, Community, Settings)
  - 3D WonderBuild Engine template links (CTA, Documentation, Start Free, Go Pro, Privacy, Terms, Contact)
  - 3D Library asset details links
- [x] Verified no empty event handlers (onClick="", onSubmit="")
- [x] Verified no console.log('todo') or similar placeholder handlers in production code
- [x] Fixed WonderPlay 3D redirect to subdomain with auth token forwarding
- [x] All interactive elements now either work correctly or link to valid destinations

## Notes
- The console.log statements in apps/web/lib/builder/blocks/utility.ts (default JS block) and 
  apps/web/lib/builder/components/InspectorPanel.tsx (placeholder text) are intentional examples
  for users and do not need to be fixed.
- TODOs in vendor code (webglstudio directory) are not our responsibility to fix.
