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
- Type/build checks pass in CI before merge.

## Phase 1 — Locate and isolate

- [x] Locate static signpost component and homepage mount point.
- [x] Confirm existing Three.js / React Three Fiber dependencies.
- [x] Create isolated feature branch.
- [ ] Add dedicated `Npc3DPreview` component; do not overload unrelated homepage code.

## Phase 2 — Real 3D preview

- [ ] Build a procedural humanoid NPC from Three.js geometry so the preview has no fragile remote asset dependency.
- [ ] Add lighting, stage, holographic rings/grid, and camera composition.
- [ ] Add idle breathing/head motion.
- [ ] Add user-controlled orbit with constrained zoom/rotation.
- [ ] Add NPC states: `idle`, `listening`, `thinking`, `speaking`.
- [ ] Add behavior/action trigger and visible state feedback.

## Phase 3 — NPC product UI

- [ ] Add live status badge.
- [ ] Add feature cards for Personality, Voice, Memory, Actions/Behavior.
- [ ] Add conversation preview with input + safe local demo responses.
- [ ] Demonstrate local session memory without pretending the public demo is a paid/live model call.
- [ ] Add clear CTA to the real NPC/WebGL editor.

## Phase 4 — Reliability and accessibility

- [ ] Lazy-load/render only on client.
- [ ] Add WebGL/component error fallback with working CTA.
- [ ] Respect `prefers-reduced-motion`.
- [ ] Ensure mobile layout does not overflow or trap touch scrolling.
- [ ] Add useful ARIA labels and keyboard-operable controls.
- [ ] Keep animation/render costs bounded for lower-end devices.

## Phase 5 — Integration and cleanup

- [ ] Replace `InteractiveSignpost` usage in `Homepage.tsx`.
- [ ] Remove unused `InteractiveSignpost` import from homepage.
- [ ] Keep the old component/file for now unless confirmed unused elsewhere; do not delete unrelated routes/assets in this change.
- [ ] Verify no new external network dependency is required for the 3D scene.

## Phase 6 — Validation

- [ ] Run/inspect TypeScript and lint/build checks available in CI.
- [ ] Check desktop and mobile layout behavior.
- [ ] Check WebGL fallback behavior.
- [ ] Review diff for accidental unrelated changes.
- [ ] Open PR with implementation notes and remaining limitations, if any.
