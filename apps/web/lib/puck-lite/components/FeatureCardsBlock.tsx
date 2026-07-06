"use client";

type FeatureItem = {
  icon: string;
  title: string;
  desc: string;
};

export type FeatureCardsBlockProps = {
  eyebrow: string;
  headline: string;
  columns: "2" | "3" | "4";
  accentColor: "cyan" | "violet" | "amber" | "pink";
  features: FeatureItem[];
};

const accents = {
  cyan: { border: "border-cyan-500/20 hover:border-cyan-500/40", label: "text-cyan-400", icon: "bg-cyan-500/10 text-cyan-300" },
  violet: { border: "border-violet-500/20 hover:border-violet-500/40", label: "text-violet-400", icon: "bg-violet-500/10 text-violet-300" },
  amber: { border: "border-amber-500/20 hover:border-amber-500/40", label: "text-amber-400", icon: "bg-amber-500/10 text-amber-300" },
  pink: { border: "border-pink-500/20 hover:border-pink-500/40", label: "text-pink-400", icon: "bg-pink-500/10 text-pink-300" },
};

const cols = {
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-3",
  "4": "sm:grid-cols-2 lg:grid-cols-4",
};

const DEFAULT_FEATURES: FeatureItem[] = [
  { icon: "⚡", title: "5 AI Chats/day", desc: "Available on The Nomad free plan." },
  { icon: "∞", title: "Unlimited AI", desc: "Unlock on The Architect plan." },
  { icon: "🌐", title: "3D Engine", desc: "Full WebGL Studio access." },
  { icon: "🗣", title: "Voice Module", desc: "Egyptian hieroglyphic synthesis." },
  { icon: "🚀", title: "1-Click Deploy", desc: "Ship instantly to the cloud." },
  { icon: "🔥", title: "God Mode", desc: "Exclusive to The Creator tier." },
];

export default function FeatureCardsBlock({
  eyebrow = "Platform Features",
  headline = "Everything you need to build",
  columns = "3",
  accentColor = "cyan",
  features = DEFAULT_FEATURES,
}: FeatureCardsBlockProps) {
  const a = accents[accentColor];

  return (
    <div className="p-4" data-block="feature-cards">
      {(eyebrow || headline) && (
        <div className="mb-6">
          {eyebrow && <p className={`mb-1 text-xs font-bold uppercase tracking-widest ${a.label}`}>{eyebrow}</p>}
          {headline && <h2 className="text-2xl font-extrabold text-white">{headline}</h2>}
        </div>
      )}
      <div className={`grid grid-cols-1 gap-4 ${cols[columns]}`}>
        {features.map((f, i) => (
          <div
            key={i}
            className={`rounded-2xl border bg-white/[0.03] p-5 transition ${a.border}`}
          >
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg ${a.icon}`}>
              {f.icon}
            </div>
            <p className="mb-1 text-sm font-bold text-white">{f.title}</p>
            <p className="text-xs text-white/50">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
