"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Box,
  Download,
  FileImage,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  MoreVertical,
  RefreshCw,
  Settings2,
  Sparkles,
  WandSparkles,
} from "lucide-react";

type UserAsset = {
  id: string;
  name: string;
  source: string;
  downloadUrl: string;
  thumbnailUrl: string;
};

type Generation = {
  url: string;
  prompt: string;
  provider?: string;
  model?: string;
  size: string;
  createdAt: number;
};

const STYLES = [
  ["Realistic", "photo"],
  ["Cinematic", "cinematic"],
  ["Anime", "anime"],
  ["Concept Art", "concept art"],
  ["3D Render", "3D render"],
  ["Game Asset", "game asset"],
] as const;

const SIZES = [
  { label: "1:1", size: "1024x1024", sub: "1024 × 1024" },
  { label: "16:9", size: "1536x1024", sub: "1536 × 1024" },
  { label: "9:16", size: "1024x1536", sub: "1024 × 1536" },
] as const;

const quickPrompts = ["3D Game Asset", "Website Hero", "Fantasy", "Sci-Fi", "Anime", "Product"];

export default function ImageStudioPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [prompt, setPrompt] = useState("a futuristic city floating in the sky with flying cars, at sunset, cinematic, highly detailed, sci-fi");
  const [negativePrompt, setNegativePrompt] = useState("blurry, low quality, distorted, text, watermark");
  const [style, setStyle] = useState("cinematic");
  const [size, setSize] = useState("1536x1024");
  const [count, setCount] = useState(1);
  const [quality, setQuality] = useState<"fast" | "balanced" | "high">("balanced");
  const [seed, setSeed] = useState("Random");
  const [steps, setSteps] = useState(4);
  const [guidance, setGuidance] = useState(3.5);
  const [creativity, setCreativity] = useState(70);
  const [format, setFormat] = useState("PNG");
  const [background, setBackground] = useState("Auto");
  const [saveTo, setSaveTo] = useState<"library" | "project" | "download">("library");
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState<Generation | null>(null);
  const [recent, setRecent] = useState<Generation[]>([]);
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetFilter, setAssetFilter] = useState("All");

  async function loadAssets() {
    setAssetsLoading(true);
    try {
      const response = await fetch("/api/assets/user", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (response.ok) setAssets(Array.isArray(data.assets) ? data.assets : []);
    } finally {
      setAssetsLoading(false);
    }
  }

  useEffect(() => {
    void loadAssets();
  }, []);

  async function generate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError("");

    try {
      const results: Generation[] = [];
      const total = Math.min(count, 4);
      for (let index = 0; index < total; index += 1) {
        const composedPrompt = negativePrompt.trim()
          ? `${prompt.trim()}\n\nAvoid: ${negativePrompt.trim()}`
          : prompt.trim();

        const response = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: composedPrompt,
            style,
            size,
            workspaceId: projectId || "image-studio",
            type: "image-studio",
            saveTo,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.imageUrl) {
          throw new Error(data.error || "Image generation failed.");
        }

        results.push({
          url: data.imageUrl,
          prompt: prompt.trim(),
          provider: data.provider,
          model: data.model,
          size: data.size || size,
          createdAt: Date.now() + index,
        });
      }

      if (results.length) {
        setCurrent(results[0]);
        setRecent((existing) => [...results, ...existing].slice(0, 12));
        if (saveTo === "library") {
          window.setTimeout(() => void loadAssets(), 600);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  function downloadCurrent() {
    if (!current?.url) return;
    const anchor = document.createElement("a");
    anchor.href = current.url;
    anchor.download = `ai-wonderland-image-${Date.now()}.png`;
    anchor.rel = "noopener";
    anchor.click();
  }

  const filteredAssets = useMemo(() => {
    if (assetFilter === "All") return assets;
    if (assetFilter === "Images") return assets.filter((asset) => /image|png|jpg|jpeg|webp/i.test(`${asset.source} ${asset.name}`));
    if (assetFilter === "3D Models") return assets.filter((asset) => /3d|glb|gltf|model/i.test(`${asset.source} ${asset.name}`));
    if (assetFilter === "Generated") return assets.filter((asset) => /ai|generated/i.test(asset.source));
    return assets;
  }, [assetFilter, assets]);

  return (
    <div className="min-h-screen bg-[#06101c] text-white">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#091522]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-950/40">
              <ImageIcon size={23} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Image Studio</h1>
              <p className="text-sm text-white/45">Generate amazing images for your projects, websites, games, and more.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/[.08]"
          >
            <Settings2 size={15} /> Generation Settings
          </button>
        </header>

        <nav className="flex items-center gap-1 overflow-x-auto border-b border-white/10 px-3">
          {[
            ["Generate", "#generate"],
            ["History", "#history"],
            ["My Assets", "#my-assets"],
            ["Project Assets", projectId ? `/dashboard/projects/${encodeURIComponent(projectId)}/files` : "/dashboard#projects"],
            ["Send to 3D", "/dashboard/3dhub"],
            ["API Docs", "/api-reference"],
          ].map(([label, href], index) => (
            <Link
              key={label}
              href={href}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm ${index === 0 ? "border-violet-500 bg-violet-500/10 font-semibold text-white" : "border-transparent text-white/55 hover:text-white"}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div id="generate" className={`grid gap-3 p-3 ${settingsOpen ? "2xl:grid-cols-[minmax(360px,.88fr)_minmax(520px,1.35fr)_330px]" : "xl:grid-cols-[minmax(360px,.8fr)_minmax(540px,1.4fr)]"}`}>
          <section className="rounded-xl border border-white/10 bg-[#0b1726] p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-bold">Prompt</h2>
              <button type="button" className="inline-flex items-center gap-1 rounded-lg bg-violet-500/15 px-2.5 py-1.5 text-xs font-semibold text-violet-200">
                <WandSparkles size={13} /> Prompt Enhance
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={5}
              maxLength={1000}
              className="w-full resize-none rounded-xl border border-white/10 bg-[#08121f] p-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-violet-500/50"
            />
            <div className="mt-1 text-right text-[10px] text-white/25">{prompt.length}/1000</div>

            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span>Quick Prompts</span>
                <span className="text-blue-400">View All</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((item) => (
                  <button key={item} type="button" onClick={() => setPrompt((value) => `${value ? `${value}, ` : ""}${item.toLowerCase()}`)} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[11px] text-white/70 hover:border-violet-500/40 hover:text-white">
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <h3 className="mb-2 text-xs font-semibold">Style</h3>
              <div className="grid grid-cols-3 gap-2">
                {STYLES.map(([label, value], index) => (
                  <button key={value} type="button" onClick={() => setStyle(value)} className={`overflow-hidden rounded-lg border text-left ${style === value ? "border-violet-500 ring-1 ring-violet-500/60" : "border-white/10"}`}>
                    <div className={`h-12 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,.5),transparent_25%),linear-gradient(135deg,${index % 2 ? "#311257" : "#183653"},#07111d)]`} />
                    <div className="bg-[#0a1422] px-2 py-1.5 text-[10px] font-semibold">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <h3 className="mb-2 text-xs font-semibold">Aspect Ratio</h3>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((item) => (
                  <button key={item.size} type="button" onClick={() => setSize(item.size)} className={`rounded-lg border px-2 py-2 text-center ${size === item.size ? "border-violet-500 bg-violet-500/10 text-white" : "border-white/10 bg-white/[.03] text-white/65"}`}>
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="mt-0.5 text-[9px] text-white/35">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold">Number of Images</h3>
              <div className="flex gap-2">
                {[1, 2, 4].map((value) => (
                  <button key={value} type="button" onClick={() => setCount(value)} className={`min-w-12 rounded-lg border px-4 py-2 text-xs font-bold ${count === value ? "border-violet-500 bg-violet-500/15" : "border-white/10 bg-white/[.03]"}`}>{value}</button>
                ))}
              </div>
            </div>

            <button type="button" onClick={() => void generate()} disabled={generating || !prompt.trim()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold shadow-lg shadow-violet-950/40 disabled:cursor-not-allowed disabled:opacity-50">
              {generating ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
              {generating ? "Generating…" : "Generate Image"}
            </button>
            {error && <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">{error}</p>}
          </section>

          <section className="flex min-h-[640px] flex-col rounded-xl border border-white/10 bg-[#0b1726] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-bold"><FileImage size={17} className="text-violet-300" /> Generated Image</h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/60 hover:bg-white/5">Upscale</button>
                <button type="button" onClick={() => current && setPrompt(current.prompt)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/60 hover:bg-white/5">Variations</button>
                <button type="button" className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/60 hover:bg-white/5">Edit</button>
                <button type="button" onClick={downloadCurrent} disabled={!current} className="rounded-lg border border-white/10 p-1.5 text-white/60 hover:bg-white/5 disabled:opacity-30"><Download size={15} /></button>
                <button type="button" className="rounded-lg border border-white/10 p-1.5 text-white/60"><MoreVertical size={15} /></button>
              </div>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,.18),transparent_32%),#07111d]">
              {current ? (
                <img src={current.url} alt={current.prompt} className="h-full max-h-[590px] w-full object-contain" />
              ) : generating ? (
                <div className="text-center text-white/50"><Loader2 className="mx-auto mb-3 animate-spin text-violet-300" size={34} /><p className="text-sm">Creating your image…</p></div>
              ) : (
                <div className="max-w-sm p-8 text-center">
                  <ImageIcon className="mx-auto mb-4 text-white/15" size={56} />
                  <p className="text-sm font-semibold text-white/45">Your generated image will appear here.</p>
                  <p className="mt-2 text-xs leading-5 text-white/25">Use the prompt controls on the left, then generate when ready.</p>
                </div>
              )}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Link href={projectId ? `/wonder-build/builder?projectId=${encodeURIComponent(projectId)}` : "/wonder-build"} className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-2.5 text-center text-xs font-semibold hover:bg-white/[.06]">Use in Builder</Link>
              <button type="button" onClick={() => setSaveTo("project")} className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-2.5 text-xs font-semibold hover:bg-white/[.06]">Save to Project</button>
              <Link href="/dashboard/ai-generator" className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-2.5 text-center text-xs font-semibold hover:bg-white/[.06]">Send to 3D AI</Link>
              <Link href="/dashboard/3dhub" className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-2.5 text-center text-xs font-semibold hover:bg-white/[.06]">Send to PlayCanvas</Link>
            </div>
          </section>

          {settingsOpen && (
            <aside className="rounded-xl border border-white/10 bg-[#08131f] p-4 2xl:sticky 2xl:top-24 2xl:self-start">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold"><Settings2 size={16} className="text-violet-300" /> Generation Settings</h2>
                <button type="button" onClick={() => setSettingsOpen(false)} className="text-white/35 hover:text-white">×</button>
              </div>

              <label className="text-xs font-semibold">Model</label>
              <select className="mt-2 w-full rounded-lg border border-white/10 bg-[#0c1928] px-3 py-2.5 text-xs">
                <option>Auto — best available provider</option>
                <option>Flux Schnell</option>
                <option>OpenAI Image</option>
                <option>Gemini Image</option>
              </select>
              <p className="mt-1 text-[9px] text-white/30">The backend falls back safely when a configured provider is unavailable.</p>

              <label className="mt-4 block text-xs font-semibold">Image Size</label>
              <select value={size} onChange={(event) => setSize(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#0c1928] px-3 py-2.5 text-xs">
                <option value="1536x1024">1536 × 1024 (Landscape)</option>
                <option value="1024x1024">1024 × 1024 (Square)</option>
                <option value="1024x1536">1024 × 1536 (Portrait)</option>
              </select>

              <div className="mt-4">
                <span className="text-xs font-semibold">Quality</span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["fast", "balanced", "high"] as const).map((value) => (
                    <button key={value} type="button" onClick={() => setQuality(value)} className={`rounded-lg border px-2 py-2 text-[10px] capitalize ${quality === value ? "border-violet-500 bg-violet-500/10" : "border-white/10 text-white/55"}`}>{value}</button>
                  ))}
                </div>
              </div>

              <label className="mt-4 block text-xs font-semibold">Seed</label>
              <div className="mt-2 flex gap-2">
                <input value={seed} onChange={(event) => setSeed(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0c1928] px-3 py-2.5 text-xs" />
                <button type="button" onClick={() => setSeed(String(Math.floor(Math.random() * 1_000_000)))} className="rounded-lg border border-white/10 px-3"><RefreshCw size={14} /></button>
              </div>

              <label className="mt-4 block text-xs font-semibold">Negative Prompt</label>
              <textarea value={negativePrompt} onChange={(event) => setNegativePrompt(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#0c1928] p-3 text-xs leading-5" />

              <details className="mt-4" open>
                <summary className="cursor-pointer text-xs font-semibold">Advanced Settings</summary>
                <div className="mt-3 space-y-4">
                  <label className="block text-[10px] text-white/50">Steps <span className="float-right text-white">{steps}</span><input type="range" min={1} max={20} value={steps} onChange={(event) => setSteps(Number(event.target.value))} className="mt-2 w-full accent-violet-500" /></label>
                  <label className="block text-[10px] text-white/50">Guidance <span className="float-right text-white">{guidance.toFixed(1)}</span><input type="range" min={1} max={10} step={0.5} value={guidance} onChange={(event) => setGuidance(Number(event.target.value))} className="mt-2 w-full accent-violet-500" /></label>
                  <label className="block text-[10px] text-white/50">Creativity <span className="float-right text-white">{creativity}%</span><input type="range" min={0} max={100} value={creativity} onChange={(event) => setCreativity(Number(event.target.value))} className="mt-2 w-full accent-violet-500" /></label>
                </div>
              </details>

              <div className="mt-5 border-t border-white/10 pt-4">
                <h3 className="text-xs font-semibold">Output</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="text-[10px] text-white/45">Format<select value={format} onChange={(event) => setFormat(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c1928] px-2 py-2 text-xs text-white"><option>PNG</option><option>JPG</option><option>WEBP</option></select></label>
                  <label className="text-[10px] text-white/45">Background<select value={background} onChange={(event) => setBackground(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c1928] px-2 py-2 text-xs text-white"><option>Auto</option><option>Opaque</option></select></label>
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-xs font-semibold">Save To</h3>
                <div className="mt-2 space-y-2 text-xs">
                  <label className="flex items-center gap-2"><input type="radio" checked={saveTo === "library"} onChange={() => setSaveTo("library")} /> AI WONDERLAND Library</label>
                  <label className={`flex items-center gap-2 ${!projectId ? "text-white/30" : ""}`}><input type="radio" disabled={!projectId} checked={saveTo === "project"} onChange={() => setSaveTo("project")} /> Current Project Assets</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={saveTo === "download"} onChange={() => setSaveTo("download")} /> Download Only</label>
                </div>
              </div>

              <button type="button" onClick={() => { setQuality("balanced"); setSeed("Random"); setSteps(4); setGuidance(3.5); setCreativity(70); setFormat("PNG"); setBackground("Auto"); }} className="mt-6 w-full rounded-lg border border-white/10 px-3 py-2.5 text-xs text-white/60 hover:bg-white/[.04]">
                Reset to Defaults
              </button>
            </aside>
          )}
        </div>
      </section>

      <section id="history" className="mt-8 rounded-2xl border border-white/10 bg-[#091522] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Recent Generations</h2>
            <p className="mt-1 text-xs text-white/40">Your latest images from this session.</p>
          </div>
        </div>
        {recent.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {recent.map((item) => (
              <button key={item.createdAt} type="button" onClick={() => setCurrent(item)} className="overflow-hidden rounded-xl border border-white/10 bg-[#07111d] text-left hover:border-violet-500/50">
                <img src={item.url} alt={item.prompt} className="aspect-video w-full object-cover" />
                <div className="p-2"><p className="truncate text-[11px] font-semibold">{item.prompt}</p><p className="mt-1 text-[9px] text-white/35">{item.size}</p></div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/30">Your recent generations will appear here.</div>
        )}
      </section>

      <section id="my-assets" className="mt-12 mb-16 rounded-2xl border border-white/10 bg-[#091522] p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-300">Your library</p>
            <h2 className="mt-1 text-2xl font-black">My Assets</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/45">Your saved images, generated media, 3D models, uploads and other reusable assets live here. This library continues below the generator instead of being squeezed into the generation panel.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "Images", "3D Models", "Generated"].map((filter) => (
              <button key={filter} type="button" onClick={() => setAssetFilter(filter)} className={`rounded-full border px-3 py-1.5 text-xs ${assetFilter === filter ? "border-violet-500 bg-violet-500/15 text-white" : "border-white/10 text-white/50"}`}>{filter}</button>
            ))}
            <button type="button" onClick={() => void loadAssets()} className="rounded-full border border-white/10 p-2 text-white/45 hover:text-white"><RefreshCw size={13} /></button>
          </div>
        </div>

        <div className="mt-6">
          {assetsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{Array.from({ length: 12 }).map((_, index) => <div key={index} className="aspect-square animate-pulse rounded-xl bg-white/[.05]" />)}</div>
          ) : filteredAssets.length ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {filteredAssets.map((asset) => (
                <article key={asset.id} className="group overflow-hidden rounded-xl border border-white/10 bg-[#07111d] hover:border-violet-500/40">
                  <div className="relative aspect-square bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,.13),transparent_35%),#08121d]">
                    {asset.thumbnailUrl ? (
                      <img src={asset.thumbnailUrl} alt={asset.name} className="h-full w-full object-cover" />
                    ) : /\.(png|jpe?g|webp|gif)$/i.test(asset.downloadUrl || "") ? (
                      <img src={asset.downloadUrl} alt={asset.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center"><Box className="text-white/15" size={40} /></div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs font-semibold">{asset.name}</p>
                    <p className="mt-1 truncate text-[9px] uppercase tracking-wide text-white/30">{asset.source || "asset"}</p>
                    <div className="mt-3 flex gap-2">
                      <a href={asset.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-lg border border-white/10 px-2 py-1.5 text-center text-[10px] text-white/60 hover:bg-white/[.05]">Open</a>
                      <Link href="/dashboard/3dhub" className="rounded-lg border border-white/10 px-2 py-1.5 text-[10px] text-white/60 hover:bg-white/[.05]">3D</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
              <FolderOpen className="mx-auto mb-3 text-white/15" size={42} />
              <p className="font-semibold text-white/55">Your asset library is empty.</p>
              <p className="mt-2 text-xs text-white/30">Generate images, upload assets, or save models and they will appear here.</p>
              <Link href="/library" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-white/65 hover:bg-white/[.04]">Open full library <ArrowRight size={13} /></Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
