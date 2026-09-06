# Homepage 3D AI NPC Preview — TODO

Target: replace the static Wonderland signpost image in the homepage `#explore` section with a real, interactive WebGL/Three.js NPC product preview.

## Definition of done

- The old `wonderland-theme.webp` signpost preview is no longer rendered in the homepage explore section.
- The replacement is real 3D rendered in-browser, not a generated/static hero image.
- The preview works without external model/CDN dependencies.
- Users can orbit the camera, trigger NPC behavior, and interact with a demo conversation panel.
- The component is responsive and keyboard/screen-reader considerate.
- Reduced-motion and WebGL failure paths degrade gracefully.
- The section clearly routes users into the real NPC/WebGL product.
- No secrets, paid AI calls, or unauthenticated backend usage are introduced by the homepage demo.
- Feature-specific TypeScript checks pass before merge.
- Repo-wide build must be evaluated separately because `Master` currently has unrelated missing-module failures.

## Phase 1 — Locate and isolate

- [x] Locate static signpost component and homepage mount point.
- [x] Confirm existing Three.js / React Three Fiber dependencies.
- [x] Create isolated feature branch.
- [x] Add dedicated `Npc3DPreview` component; do not overload unrelated homepage code.

## Phase 2 — Real 3D preview

- [x] Build a procedural humanoid NPC from Three.js geometry so the preview has no fragile remote asset dependency.
- [x] Add lighting, stage, holographic rings/grid, and camera composition.
- [x] Add idle breathing/head motion.
- [x] Add user-controlled orbit with constrained zoom/rotation.
- [x] Add NPC states: `idle`, `listening`, `thinking`, `speaking`, and `wave`.
- [x] Add behavior/action trigger and visible state feedback.

## Phase 3 — NPC product UI

- [x] Add live status badge.
- [x] Add feature cards for Personality, Voice, Memory, Actions/Behavior.
- [x] Add conversation preview with input + safe local demo responses.
- [x] Demonstrate local session memory without pretending the public demo is a paid/live model call.
- [x] Add clear CTA to the real NPC/WebGL editor.

## Phase 4 — Reliability and accessibility

- [x] Lazy-load and render the 3D preview client-side only.
- [x] Add WebGL/component error fallback with working CTA.
- [x] Respect `prefers-reduced-motion`.
- [ ] Manually verify touch scrolling/orbit behavior on a real phone/tablet before production merge.
- [x] Add useful ARIA labels and keyboard-operable controls.
- [x] Keep animation/render costs bounded for lower-end devices (no shadows/remote assets, DPR capped at 1.5, constrained scene complexity).

## Phase 5 — Integration and cleanup

- [x] Replace the old signpost render path: `InteractiveSignpost` is now a compatibility wrapper around `Npc3DPreview`.
- [x] Keep the existing homepage import intentionally to minimize blast radius; no unrelated homepage rewrite required.
- [x] Keep the compatibility file for now; do not delete unrelated routes/assets in this change.
- [x] Verify no new external network/model dependency is required for the 3D scene.

## Phase 6 — Validation

- [x] Add a Node 22 targeted CI type-check for the two homepage NPC preview files.
- [x] Targeted TypeScript check passes in GitHub Actions.
- [ ] Manually check desktop rendering in a browser after deployment/preview environment is available.
- [ ] Manually check mobile rendering/touch behavior on a real device after deployment/preview environment is available.
- [ ] Manually force/verify WebGL-unavailable fallback in a browser.
- [x] Review change scope: only the NPC preview, compatibility wrapper, TODO, and targeted CI workflow are changed.
- [x] Open PR with implementation notes and limitations: PR #342.
- [ ] Repo-wide `next build --webpack` is green. Current failure is pre-existing and unrelated to this component (see below).

## Repo-wide CI blocker discovered during validation

The existing CI reaches `next build --webpack` and fails before feature-level build completion on repository-level missing module resolution/dependency issues:

- `@/infra/services/storage/provider`
- `@/infra/services/jobs/orchestrateScenePipeline`
- `@/infra/services/storage/promoteTempScene`
- `@/runners/registry.worker`
- `@t3-oss/env-nextjs`

The first four targets exist at repository-root paths but are not resolving through the current web-app alias configuration. `@t3-oss/env-nextjs` is imported by `lib/env.ts` but is not declared in the current root dependency manifest. The existing CI workflow also runs Node 20 while multiple installed packages declare Node 22+ requirements.

These failures predate this NPC preview branch and should be fixed in a separate build-baseline change rather than hidden inside the visual feature PR.
