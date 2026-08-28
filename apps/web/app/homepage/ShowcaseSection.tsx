import Image from "next/image";
import Link from "next/link";
import { logger } from '@/lib/logger';

type ShowcaseItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  gradient: string;
  badge: string;
};

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "wonderbuild",
    title: "WonderBuild",
    description: "Build apps and websites with drag-and-drop, code editing, and live preview. Visual builder with AI assistance.",
    image: "/images/3DSYSTEMSIMAGE.webp",
    href: "/wonder-build/builder",
    gradient: "from-violet-600/20 to-fuchsia-600/10",
    badge: "Visual Builder",
  },
  {
    id: "npc-ai-sim",
    title: "WonderPlay",
    description: "Real-time 3D world editor powered by PlayCanvas. Build immersive environments with physics, materials, lighting, and AI-assisted scene generation.",
    image: "/images/3DWONDERPLAYIMAGE.webp",
    href: "/wonder-build/playcanvas",
    gradient: "from-blue-600/20 to-cyan-600/10",
    badge: "3D Engine",
  },
  {
    id: "wonderspace-ide",
    title: "WonderSpace IDE",
    description: "Full browser-based IDE with WebContainer. Code, run, and deploy from anywhere. Integrated AI autocomplete, debugging, and Git support.",
    image: "/images/screenshots/theia-builder.svg",
    href: "/ide",
    gradient: "from-amber-600/20 to-orange-600/10",
    badge: "Cloud IDE",
  },
  {
    id: "ai-wonder",
    title: "AI Wonderland",
    description: "The flagship experience. Describe a scene in natural language — AI generates the 3D world, populates it with assets, and sets up lighting and physics automatically.",
    image: "/images/3DPLAYIMAGE.webp",
    href: "/wonder-build/playcanvas",
    gradient: "from-purple-600/20 to-pink-600/10",
    badge: "Flagship Experience",
  },
];

function ShowcaseCard({ item }: { item: ShowcaseItem }) {
  return (
    <Link
      href={item.href}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${item.gradient} p-0.5 transition duration-300 hover:border-white/30 hover:shadow-2xl hover:shadow-purple-900/20`}
    >
      <div className="relative h-full rounded-2xl bg-black/60 p-5 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
            {item.badge}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30 transition group-hover:text-white/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <line x1="7" y1="17" x2="17" y2="7"/>
            <polyline points="7 7 17 7 17 17"/>
          </svg>
        </div>

        <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl border border-white/5 bg-zinc-900/80">
          {item.image ? (
            <Image src={item.image} alt={item.title} fill className="object-cover opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-100" sizes="(max-width: 768px) 100vw, 400px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/40 via-black to-pink-900/40">
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="text-2xl">🤖</span>
                  <span className="text-2xl">+</span>
                  <span className="text-2xl">🌐</span>
                </div>
                <p className="text-[10px] text-white/40 font-mono">AI → 3D Pipeline</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
        <p className="text-xs text-white/60 leading-relaxed">{item.description}</p>

        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-purple-400 opacity-0 transition group-hover:opacity-100">
          <span>Explore</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function ShowcaseSection() {
  return (
    <section className="relative mx-auto mt-10 w-full max-w-7xl px-6 sm:px-8">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-400">
          What You Can Build
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Four ways to create
        </h2>
        <p className="mt-2 text-sm text-white/50 max-w-lg mx-auto">
          Pick your tool. Describe your vision. Watch it come to life.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SHOWCASE_ITEMS.map((item) => (
          <ShowcaseCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
