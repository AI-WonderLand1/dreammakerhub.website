# Homepage 3D AI NPC Preview — TODO

Target: replace the static Wonderland signpost image in the homepage `#explore` section with a real, interactive WebGL/Three.js NPC product preview.

## Definition of done

- The old `wonderland-theme.webp` signpost preview is no longer rendered in the homepage explore section.
- The replacement is real 3D rendered in-browser, not a generated/static hero image.
- The primary character is a real skinned/rigged GLB with skeletal animation clips.
- The GLB is bundled locally and integrity-checked so production does not depend on a third-party model CDN.
- Users can orbit the camera, trigger NPC behavior, and interact with a demo conversation panel.
- The component is responsive and keyboard/screen-reader considerate.
- Reduced-motion and WebGL failure paths degrade gracefully.
- The section clearly routes users into the real NPC/WebGL product.
- No secrets, paid AI calls, or unauthenticated backend usage are introduced by the homepage demo.
- Feature-specific model verification and TypeScript checks pass before merge.
- Repo-wide build is evaluated separately because `Master` currently has unrelated missing-module failures.

## Phase 1 — Locate and isolate

- [x] Locate static signpost component and homepage mount point.
- [x] Confirm existing Three.js / React Three Fiber dependencies.
- [x] Create isolated feature branch.
- [x] Add dedicated `NpcExperiencePreview` component; do not overload unrelated homepage code.

## Phase 2 — Real 3D NPC

- [x] Replace the static image with a true React Three Fiber/WebGL viewport.
- [x] Bundle a real skinned/rigged GLB locally under `apps/web/public/models/npc/`.
- [x] Pin the upstream model source and store license/hash provenance in the repo.
- [x] Verify the bundled model SHA-256 in feature CI.
- [x] Normalize the loaded model to the stage so viewport composition is not dependent on arbitrary source scale.
- [x] Drive the character with real animation clips: Idle, Standing, Wave, ThumbsUp, and Dance.
- [x] Cross-fade animation state changes rather than snapping poses.
- [x] Add state-linked facial morph behavior where supported by the model.
- [x] Add lighting, holographic rings/grid, particles, and cinematic camera composition.
- [x] Add user-controlled orbit with constrained zoom/rotation.
- [x] Add visible state feedback for idle/listening/thinking/speaking/actions.

## Phase 3 — NPC product UI

- [x] Add live runtime status badge.
- [x] Add feature cards for Personality, Voice, Memory, and Behavior.
- [x] Add conversation preview with input + safe local demo responses.
- [x] Demonstrate local session memory without pretending the public demo is a paid/live model call.
- [x] Fix state-transition races so old animation timers cannot interrupt newer chat/action states.
- [x] Add real behavior controls for Wave, Thumbs Up, Dance, and Listen.
- [x] Add clear CTA to the real NPC/WebGL editor.

## Phase 4 — Reliability and accessibility

- [x] Lazy-load/render the 3D preview client-side only.
- [x] Add WebGL/component failure fallback with working CTA.
- [x] Respect `prefers-reduced-motion` by slowing character animation and removing particle motion.
- [ ] Manually verify touch scrolling/orbit behavior on a real phone/tablet before production merge.
- [x] Add useful ARIA labels and keyboard-operable form/action controls.
- [x] Keep render cost bounded with capped DPR, no dynamic shadows, constrained camera controls, and a ~464 KB local model.
- [x] Avoid runtime third-party model/CDN requests.

## Phase 5 — Integration and cleanup

- [x] Replace the old signpost render path while keeping `InteractiveSignpost` as a small compatibility wrapper.
- [x] Point the wrapper to the new rigged `NpcExperiencePreview` implementation.
- [x] Remove the obsolete procedural `Npc3DPreview` implementation after the rigged version replaced it.
- [x] Remove the one-time model bootstrap workflow after the asset was safely committed.
- [x] Keep the existing homepage import intentionally to minimize blast radius.
- [x] Do not delete unrelated routes/assets in this feature change.

## Phase 6 — Validation

- [x] Add a Node 22 targeted CI type-check for the homepage NPC preview.
- [x] Add model existence + SHA-256 integrity verification to targeted CI.
- [x] Targeted NPC Preview Check passes in GitHub Actions after the rigged model integration.
- [ ] Manually check final desktop rendering in a browser/preview deployment.
- [ ] Manually check mobile rendering/touch behavior on a real device.
- [ ] Manually force/verify WebGL-unavailable fallback in a browser.
- [x] Review change scope and remove temporary bootstrap/dead NPC code.
- [x] Open PR with implementation notes: PR #342.
- [ ] Repo-wide `next build --webpack` is green. Current repo-level blocker is pre-existing and unrelated to this component (see below).

## Model provenance

The locally bundled `apps/web/public/models/npc/RobotExpressive.glb` is pinned to the documented upstream source and stored with its license/provenance in `apps/web/public/models/npc/README.md`. Feature CI verifies the exact SHA-256 before type-checking the component.

## Repo-wide CI blocker discovered during validation

The existing CI reaches `next build --webpack` and fails on repository-level missing module resolution/dependency issues that are outside this homepage NPC change:

- `@/infra/services/storage/provider`
- `@/infra/services/jobs/orchestrateScenePipeline`
- `@/infra/services/storage/promoteTempScene`
- `@/runners/registry.worker`
- `@t3-oss/env-nextjs`

The first four targets exist at repository-root paths but are not resolving through the current web-app alias configuration. `@t3-oss/env-nextjs` is imported by `lib/env.ts` but is not declared in the current root dependency manifest. The existing CI workflow also runs Node 20 while multiple installed packages declare Node 22+ requirements.

Those build-baseline problems predate this feature and should be repaired separately instead of being hidden inside the visual NPC PR.
