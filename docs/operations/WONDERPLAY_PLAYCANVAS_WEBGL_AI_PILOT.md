# WonderPlay — PlayCanvas WebGL2 + AI GLB pilot

**Status: source implementation only; NOT a verified production feature.**

## Scope

- WonderPlay Game World is the default Create tab at `/dashboard/3dhub?projectId=<owned-project-uuid>`.
- PlayCanvas WebGL2 draws the world and imports generated GLB **render entities** into it.
- A text prompt submits to the existing authenticated, server-metered `POST /api/v1/3d/generate` endpoint.
- Successful generation saves a GLB to the selected user's project in private Supabase Storage; returned signed URL is used for immediate preview.
- Save/reopen persists the **stable asset ID**, not the expiring GLB URL. The project asset API renews signed URLs on load.
- The separate "Procedural Scene" tool produces deterministic primitives and MUST NOT be represented as AI 3D generation.
- "Run World" is currently an orbiting scene preview, **not playable first-person gameplay**.

## Provider limitations

- This request path calls the pre-existing **Gradio text-to-3D Hunyuan provider**, configured by `HUNYUAN3D_API_URL`, not the private Vultr `/image-to-3d` service.
- Only the Vultr **image-to-3D** operation was previously observed working, not this text-to-3D endpoint. Do not claim text-to-3D is operational until a real test succeeds.
- If the Gradio provider URL is not configured or invalid, the API rejects before credit reservation. Network failures **after** credit reservation may still consume a credit because automatic refunds are not implemented.
- No textured output is requested by this new Game World control. The existing 3D rate is one reserved credit per generation attempt; mesh-quality billing is not implemented in this change.
- No new GPU networking, gateway, API keys, unmetered inference or model training are enabled by this change.

## Required private acceptance test

1. Create/select a real owned project in a private staging deployment with verified Supabase Auth, Storage and a tested provider.
2. Check PlayCanvas WebGL2 renders scene primitives. If unavailable, confirm a visible engine error (not a fake success).
3. Generate one simple model using the Game World prompt. Confirm **one** authorized credit reservation and one private GLB under the correct project.
4. Confirm that GLB actually becomes visible in the PlayCanvas viewport, rather than a fallback cube. Check console/viewport for shader, WebGL, CORS or asset-loader errors.
5. Save the level. Reload the page, open the saved level and confirm fresh signed GLB URL resolution.
6. With a different customer login, verify the first customer's GLB, project files, URLs and credit balance cannot be accessed.
7. Test a missing/invalid `HUNYUAN3D_API_URL`: no credit reservation; explicit error. Separately verify handling of provider failure after a reservation before considering paid rollout.
8. Check desktop Firefox Chromium and low-spec/mobile behavior, including WebGL2 capability and realistic meshes.

**Production release blocker:** no merge/deploy solely on source tests. Run the actual end-to-end staging test and verify billing, provider reliability, ownership and GLB load.
