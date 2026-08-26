# DreamMakerHub Deep-Dive Addendum — 2026-08-26

## Scope

Continued from the 2026-08-25 stopping point. Priority was current repository state, cross-repo contracts, licensing/IP, monetization, and distinguishing newly implemented code from stale documentation or scaffolding.

## 1. New commit changes the commercial/legal posture

Current `dreammakerhub.website` Master head is `70c0346b64efa41625c9c3bc658701efabce0f36`, dated 2026-08-25. The commit message is `Revise license and commercial terms in README` and its diff changes the README from an MIT-style statement to proprietary/confidential terms. It now states that the software/source are proprietary, prohibits copying/modification/distribution/sublicensing, says hosted SaaS access requires a paid subscription, and gives a licensing contact email. The same diff also changes the README's engine references from Unity/Unreal to Vanguard/PlayCanvas WebGPU. Evidence: commit `70c0346`.

This is a meaningful commercial move, but it is incomplete: the repository root `LICENSE` still contains the MIT License. The README and root license therefore conflict. Until the intended scope is explicitly separated—e.g. proprietary platform code versus intentionally open components—do not represent the entire repository as cleanly proprietary or promise sponsors specific IP rights.

## 2. README is stale after the NPC-sim cleanup

The same README still contains language describing `npc-sim` as a server-side NPC brain. Earlier repository cleanup removed the `npc-sim/` package and the StudioNPCSim scaffold. The current source contains other NPC libraries and WonderPlay AI systems, but the README wording has not been reconciled with that removal. This is a documentation integrity issue, not proof that all NPC technology was removed.

## 3. Root monorepo dependency state clarifies a prior WebSocket concern

Current root `package.json` declares `ws` as a production dependency. That means the DreamMakerHub monorepo itself has the WebSocket runtime available. The standalone `wonderplay-3D` package, however, declares `@types/ws` only and does not declare `ws` as a runtime dependency. Because WonderPlay is a separate repository/deployment boundary, the monorepo dependency cannot be assumed to satisfy the standalone deployment. The unresolved dependency remains: verify the actual WonderPlay build/runtime environment and either add `ws` to that repo or prove the deployed runtime supplies it.

## 4. AI-PLAYGROUND remains a separate application boundary

Current `AI-PLAYGROUND/main` package metadata identifies it as its own Vite/Express application with React, Three.js, Supabase, Stripe and rate-limiting dependencies. It is not a workspace package of DreamMakerHub. This confirms that provider/auth/billing contracts between AI-PLAYGROUND and DreamMakerHub are integration boundaries rather than shared modules. The previously verified provider registry and Stripe webhook work remain valid; Replicate and Hugging Face remain stubs.

## 5. Billing remains the highest-risk commercial chain

No evidence in this run disproved the prior findings: public subscription UI uses a hard-coded Stripe Payment Link, the codebase contains a dynamic checkout endpoint, webhook persistence and multiple plan/entitlement stores, while the AI/build gates do not yet prove one canonical source of truth. This remains the primary pre-sales engineering risk because a sponsor/customer payment must map deterministically to the same entitlement state used to permit paid AI/build consumption.

## 6. Current implementation classification

### Confirmed implemented
- OpenRouter transport and provider routing in DreamMakerHub.
- Authenticated premium chat and usage/realtime infrastructure.
- Multi-stage AI builder architecture.
- Coder/Kubernetes and WebContainer workspace implementations.
- Engine adapter and Spatial/Gaussian-splat integration.
- Expo/EAS mobile shell.
- AI-PLAYGROUND multi-provider registry and server-side Stripe webhook consumer.
- WonderPlay Gemini NPC reasoning/vision/video endpoints and WebSocket server code.

### Confirmed scaffold/demo/unproven
- WonderPlay public builder still points at the older builder route.
- WonderPlay live-NPC behavior remains partially simulated and end-to-end provider-backed dialogue is not proven.
- WonderPlay subscriptions are in-memory.
- WonderPlay standalone runtime dependency for `ws` is unresolved.
- AI-PLAYGROUND Replicate/Hugging Face adapters are stubs.
- Pipeline dependency-output execution remains incomplete.
- Mobile build API parity remains unresolved.
- Canonical Stripe entitlement remains unresolved.

## 7. Unresolved dependencies carried forward

1. README proprietary terms vs root MIT license — investigate exact intended license boundary next.
2. Stripe checkout -> webhook -> database -> Auth metadata -> paid feature gate.
3. Anonymous build endpoint -> quota/rate-limit/usage enforcement.
4. Coder workspace returned ID -> readiness polling.
5. WonderPlay `/live-npc` upgrade path -> `ws` runtime -> provider-backed NPC brain.
6. WebContainer vs Coder workspace role separation.
7. Pipeline graph dependency outputs -> real model/provider result -> artifact persistence.
8. Mobile `/build` contract -> real authenticated build backend.
9. Vanguard lineage between repositories.
10. Third-party dependency/license SBOM and commercial redistribution obligations.

## Next target

Trace the licensing boundary first, then follow the exact paid-user money path and the standalone WonderPlay WebSocket runtime. The objective is to identify what can safely be sold now, what requires a small repair, and what still requires substantial engineering.
