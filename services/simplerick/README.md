# SimpleRick on Vultr — image to textured GLB

The working proof of concept was run with:

- Hugging Face model: `wonderingtribe12/SimpleRick.01` (mirror of Microsoft TRELLIS-image-large)
- Vultr GPU: second NVIDIA A16 (Alice stays on the first GPU)
- Existing checkout: `/opt/simplerick-trellis` on the Vultr host, mounted at `/workspace/TRELLIS` inside `simplerick-trellis`
- Python Conda environment: `trellis`
- A tested 12-step image-to-3D render and `.glb` export

This directory adds the missing authenticated GPU HTTP service. **The worker has not yet been installed, exposed, or exercised against the live Vultr instance.** Keep the existing TRELLIS container and Alice service untouched until their current Docker configuration, ports, and persistence have been inspected.

## Data flow

1. Logged-in user selects **Image to 3D** in `/dashboard/ai-generator`, uploads a PNG/JPEG/WebP (max 8 MB), and submits.
2. Next.js validates the session and project ID, checks GPU availability, reserves one render credit, and uploads the image **server-to-server**.
3. Vultr queues up to three pending jobs, renders one job at a time on its TRELLIS GPU, and offers a temporary GLB.
4. The browser polls the site (never the GPU directly). A signed ticket binds the job to its originating Supabase user.
5. On completion, Next.js fetches the GLB, stores it in the existing private `3d-generated-assets` Supabase bucket, and returns a one-hour signed URL to the Three.js preview, download button, and `/3d-library`.

Existing text-to-3D stays on the Hunyuan route. SimpleRick only accepts reference images; there is no pretend text-to-image component. The post-process Retexture, Retopologize, Rig and Animate buttons are disabled until real backends exist.

## Deployment requirements (do not skip)

1. Check the current Vultr `simplerick-trellis` container first. Its conda packages were installed interactively and are **not** yet reproducibly captured by a Dockerfile. Do not remove/recreate the container without a verified image or persistent environment backup. Do not disturb Alice on GPU 0.
2. Add `services/simplerick/api.py` to the existing TRELLIS checkout on Vultr, install `services/simplerick/requirements-api.txt` into the tested `trellis` conda environment, and run from `/workspace/TRELLIS` as `uvicorn services.simplerick.api:app --host 0.0.0.0 --port 8100` if packaged in that location, or `uvicorn api:app` if the script is copied into the working directory. **The tested Docker container was started without a published port**; adding a worker process alone will *not* make it reachable from the website. Verify port mapping and TLS reverse proxy design first.
3. Set `SIMPLERICK_API_TOKEN` to the **same new random 32+ character secret** on both the worker and DreamMakerHub Next.js server. Never place it in a `NEXT_PUBLIC_*` variable, browser code, log, or committed file. Restart the worker after setting its environment. The worker refuses to start without it.
4. Provide a TLS-protected endpoint reachable by the DreamMakerHub server, with only the needed worker port/proxy exposed and request-size limits. Example server-only setting: `SIMPLERICK_GPU_URL=https://<your-private-gpu-endpoint>`; loopback `http://127.0.0.1:8100` is supported if the website is on the same machine/network namespace. Do **not** use a publicly open, unauthenticated port or plain HTTP across servers.
5. Add `SIMPLERICK_GPU_URL` and `SIMPLERICK_API_TOKEN` only to the website's server environment, keeping the existing private Supabase Storage service key. Deploy the website change after the GPU service answers an authenticated `/health` request from the website host.
6. Smoke test with one small PNG. Verify: render credit reserved, job `queued` → `running` → `complete`, Three.js displays the actual textured GLB, download returns `glTF` magic, and a fresh `/3d-library` visit lists the privately saved model for the same user only.

## Operational limitations to resolve before broad customer access

- **No automatic credit refund** if a job gets accepted but rendering/export/storage later fails. The preflight check prevents charging when the GPU is visibly down, but there is still a race. Integrate a refund/settlement ledger before scaling.
- Job status is in memory and temporary files expire after six hours. A worker restart loses in-flight jobs. An external job queue and durable job table are necessary for reliable production retries and recovery.
- UI polling lasts 12 minutes. Leaving/reloading the page loses its current polling ticket, although a successful saved GLB stays in Supabase. Add job persistence/resume before general availability.
- The asset list is limited to 100 project folders and 100 GLBs per folder by the current Storage helper. Add pagination before high-volume usage.
- One A16 GPU can generate one GLB at a time here. Speed and throughput for customer workloads have not been benchmarked. Texture export currently uses 512px, not the 1K/2K/4K options displayed by the historical Studio controls.
- The TRELLIS model and its transitive dependencies have their own licenses. Mirroring the checkpoint is not original model training; confirm applicable use/distribution terms before marketing it as proprietary weights.
- Conduct a real security review of image decoders, multipart upload limits at the reverse proxy, GPU network reachability, RLS/storage policy, and abuse/rate limiting before public rollout.
