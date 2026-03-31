import { getPlayCanvasMode } from "@/lib/playcanvas";

const PLAYCANVAS_BOOTSTRAP_SCRIPT_ID = "playcanvas-direct-bootstrap";
const DEFAULT_PLAYCANVAS_BOOTSTRAP_SRC = "/playcanvas/direct-bootstrap.js";

let bootstrapPromise: Promise<void> | null = null;

export function getPlayCanvasBootstrapSrc() {
  const raw = process.env.NEXT_PUBLIC_PLAYCANVAS_DIRECT_BOOTSTRAP_SRC?.trim();
  return raw && raw.length > 0 ? raw : DEFAULT_PLAYCANVAS_BOOTSTRAP_SRC;
}

export function shouldUseDirectPlayCanvasMode() {
  return getPlayCanvasMode() === "direct";
}

export function resetPlayCanvasBootstrapLoader() {
  bootstrapPromise = null;
  if (typeof window === "undefined") return;

  const script = document.getElementById(PLAYCANVAS_BOOTSTRAP_SCRIPT_ID);
  if (script) {
    script.remove();
  }
}

export function ensurePlayCanvasBootstrapLoaded() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PlayCanvas bootstrap loader requires a browser runtime"));
  }

  if (window.PlayCanvasEditorBootstrap) {
    return Promise.resolve();
  }

  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(PLAYCANVAS_BOOTSTRAP_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("PlayCanvas bootstrap script failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = PLAYCANVAS_BOOTSTRAP_SCRIPT_ID;
    script.src = getPlayCanvasBootstrapSrc();
    script.async = true;

    script.onload = () => {
      if (window.PlayCanvasEditorBootstrap) {
        resolve();
        return;
      }
      reject(new Error("PlayCanvas bootstrap loaded but window.PlayCanvasEditorBootstrap is missing"));
    };

    script.onerror = () => {
      reject(new Error(`PlayCanvas bootstrap script failed to load from ${script.src}`));
    };

    document.head.appendChild(script);
  }).catch((error) => {
    bootstrapPromise = null;
    throw error;
  });

  return bootstrapPromise;
}
