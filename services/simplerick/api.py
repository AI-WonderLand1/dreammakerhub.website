"""GPU-side SimpleRick (TRELLIS image-large) image-to-GLB worker.

Install this alongside the already-tested TRELLIS checkout on Vultr. The
Next.js server is the only intended client; browsers never call this service.
"""

import asyncio
import hmac
import io
import logging
import os
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, ImageOps, UnidentifiedImageError

logger = logging.getLogger("simplerick.gpu")

os.environ.setdefault("ATTN_BACKEND", "xformers")
os.environ.setdefault("SPCONV_ALGO", "native")

MODEL_ID = os.getenv("SIMPLERICK_MODEL_ID", "wonderingtribe12/SimpleRick.01")
TOKEN = os.getenv("SIMPLERICK_API_TOKEN", "")
OUTPUT_DIR = Path(os.getenv("SIMPLERICK_OUTPUT_DIR", "/workspace/TRELLIS/outputs/simplerick"))
MAX_UPLOAD = 8 * 1024 * 1024
MAX_QUEUED = 3
TTL_SECONDS = 6 * 3600
Image.MAX_IMAGE_PIXELS = 20_000_000

jobs: dict[str, dict] = {}
queue: asyncio.Queue[str] = asyncio.Queue(maxsize=MAX_QUEUED)
pipeline = None


def authenticate(x_render_token: str = Header(default="")) -> None:
    if not TOKEN or not hmac.compare_digest(x_render_token, TOKEN):
        raise HTTPException(status_code=401, detail="Unauthorized")


def clean_expired() -> None:
    now = time.time()
    for job_id, job in list(jobs.items()):
        if job["state"] in ("queued", "running"):
            continue
        if now - job["created"] > TTL_SECONDS:
            for suffix in (".png", ".glb"):
                (OUTPUT_DIR / f"{job_id}{suffix}").unlink(missing_ok=True)
            jobs.pop(job_id, None)


def render(job_id: str) -> None:
    global pipeline
    job = jobs[job_id]
    if pipeline is None:
        job["progress"] = 15
        from trellis.pipelines import TrellisImageTo3DPipeline

        pipeline = TrellisImageTo3DPipeline.from_pretrained(MODEL_ID)
        pipeline.cuda()

    from trellis.utils import postprocessing_utils

    job["progress"] = 35
    with Image.open(OUTPUT_DIR / f"{job_id}.png") as source:
        outputs = pipeline.run(
            source.convert("RGB"),
            seed=1,
            formats=["mesh", "gaussian"],
            sparse_structure_sampler_params={"steps": 12, "cfg_strength": 7.5},
            slat_sampler_params={"steps": 12, "cfg_strength": 3.0},
        )
    job["progress"] = 80
    glb = postprocessing_utils.to_glb(
        outputs["gaussian"][0],
        outputs["mesh"][0],
        simplify=0.95,
        fill_holes=False,
        texture_size=512,
    )
    glb.export(OUTPUT_DIR / f"{job_id}.glb")
    del outputs, glb


async def work_loop() -> None:
    while True:
        job_id = await queue.get()
        try:
            job = jobs[job_id]
            job["state"] = "running"
            job["progress"] = 10
            await asyncio.to_thread(render, job_id)
            job["state"] = "complete"
            job["progress"] = 100
        except Exception:
            # Never return internal tracebacks, file paths, or tokens to clients.
            logger.exception("SimpleRick job failed: %s", job_id)
            jobs[job_id]["state"] = "failed"
            jobs[job_id]["error"] = "GPU generation failed; check worker logs"
        finally:
            (OUTPUT_DIR / f"{job_id}.png").unlink(missing_ok=True)
            queue.task_done()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not TOKEN or len(TOKEN) < 32:
        raise RuntimeError("Set a strong SIMPLERICK_API_TOKEN (at least 32 characters)")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    worker = asyncio.create_task(work_loop())
    try:
        yield
    finally:
        worker.cancel()
        try:
            await worker
        except asyncio.CancelledError:
            pass


app = FastAPI(title="SimpleRick private GPU worker", docs_url=None, redoc_url=None, lifespan=lifespan)


@app.get("/health", dependencies=[Depends(authenticate)])
def health():
    return {"ok": True, "model": MODEL_ID, "queued": queue.qsize()}


@app.post("/jobs", status_code=202, dependencies=[Depends(authenticate)])
async def create_job(image: UploadFile = File(...)):
    clean_expired()
    if queue.full():
        raise HTTPException(status_code=429, detail="GPU queue is full")
    if image.content_type not in ("image/png", "image/jpeg", "image/webp"):
        raise HTTPException(status_code=415, detail="Use a PNG, JPEG, or WebP image")
    data = await image.read(MAX_UPLOAD + 1)
    if not data or len(data) > MAX_UPLOAD:
        raise HTTPException(status_code=413, detail="Image must be under 8 MB")
    try:
        with Image.open(io.BytesIO(data)) as source:
            source.verify()
        with Image.open(io.BytesIO(data)) as source:
            if min(source.size) < 64 or max(source.size) > 4096:
                raise ValueError("Unsupported image dimensions")
            prepared = ImageOps.exif_transpose(source).convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(status_code=400, detail="Invalid or unsupported image") from None

    job_id = str(uuid.uuid4())
    prepared.save(OUTPUT_DIR / f"{job_id}.png")
    jobs[job_id] = {"state": "queued", "progress": 5, "created": time.time()}
    try:
        queue.put_nowait(job_id)
    except asyncio.QueueFull:
        jobs.pop(job_id, None)
        (OUTPUT_DIR / f"{job_id}.png").unlink(missing_ok=True)
        raise HTTPException(status_code=429, detail="GPU queue is full") from None
    return {"id": job_id, "state": "queued", "progress": 5}


@app.get("/jobs/{job_id}", dependencies=[Depends(authenticate)])
def job_status(job_id: uuid.UUID):
    clean_expired()
    job = jobs.get(str(job_id))
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found or expired")
    return {"id": str(job_id), "state": job["state"], "progress": job["progress"], "error": job.get("error")}


@app.get("/jobs/{job_id}/glb", dependencies=[Depends(authenticate)])
def download(job_id: uuid.UUID):
    job = jobs.get(str(job_id))
    path = OUTPUT_DIR / f"{job_id}.glb"
    if job is None or job["state"] != "complete" or not path.is_file():
        raise HTTPException(status_code=404, detail="GLB unavailable")
    return FileResponse(path, media_type="model/gltf-binary", filename=f"{job_id}.glb")
