"use client";

type BentoItem = {
  icon: string;
  title: string;
  desc: string;
  span: "1" | "2";
};

export type BentoGridBlockProps = {
  items: BentoItem[];
  accentColor: "cyan" | "violet" | "amber" | "pink";
};

const accents = {
  cyan: "border-cyan-500/30 hover:border-cyan-500/60 text-cyan-400",
  violet: "border-violet-500/30 hover:border-violet-500/60 text-violet-400",
  amber: "border-amber-500/30 hover:border-amber-500/60 text-amber-400",
  pink: "border-pink-500/30 hover:border-pink-500/60 text-pink-400",
};

const DEFAULT_ITEMS: BentoItem[] = [
  { icon: "⚡", title: "Real-time 3D", desc: "Build immersive scenes instantly in the browser.", span: "2" },
  { icon: "🧠", title: "AI Co-Pilot", desc: "Let the AI architect your scenes.", span: "1" },
  { icon: "🗣", title: "Voice Module", desc: "Egyptian hieroglyphic synthesis.", span: "1" },
  { icon: "🚀", title: "1-Click Deploy", desc: "Ship your creation instantly.", span: "1" },
  { icon: "🎨", title: "Design Tokens", desc: "Sync your brand across all blocks.", span: "1" },
];

export default function BentoGridBlock({
  items = DEFAULT_ITEMS,
  accentColor = "cyan",
}: BentoGridBlockProps) {
  const accent = accents[accentColor];

  return (
    <div className="p-4" data-block="bento-grid">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item, i) => (
          <div
            key={i}
            className={[
              "rounded-2xl border bg-white/[0.03] p-5 transition",
              accent,
              item.span === "2" ? "col-span-2" : "col-span-1",
            ].join(" ")}
          >
            <span className="mb-3 block text-3xl">{item.icon}</span>
            <p className="mb-1 text-sm font-bold text-white">{item.title}</p>
            <p className="text-xs text-white/50">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
