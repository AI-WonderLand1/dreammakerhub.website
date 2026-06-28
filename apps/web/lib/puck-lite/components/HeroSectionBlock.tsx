"use client";

export type HeroSectionBlockProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  background: "neon" | "psychedelic" | "dark" | "egyptian";
};

const backgrounds = {
  neon: "bg-gradient-to-br from-cyan-950 via-black to-violet-950",
  psychedelic: "bg-gradient-to-br from-pink-950 via-purple-950 to-indigo-950",
  dark: "bg-gradient-to-b from-gray-950 to-black",
  egyptian: "bg-gradient-to-br from-amber-950 via-black to-yellow-950",
};

const glows = {
  neon: "from-cyan-500/20 via-transparent to-transparent",
  psychedelic: "from-pink-500/20 via-purple-500/10 to-transparent",
  dark: "from-white/5 via-transparent to-transparent",
  egyptian: "from-amber-500/20 via-transparent to-transparent",
};

const accents = {
  neon: "text-cyan-400",
  psychedelic: "text-pink-400",
  dark: "text-violet-400",
  egyptian: "text-amber-400",
};

const ctaColors = {
  neon: "bg-cyan-500 hover:bg-cyan-400 text-black",
  psychedelic: "bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white",
  dark: "bg-violet-600 hover:bg-violet-500 text-white",
  egyptian: "bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white",
};

export default function HeroSectionBlock({
  eyebrow,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  background = "neon",
}: HeroSectionBlockProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl px-8 py-20 text-center ${backgrounds[background]}`}
      data-block="hero-section"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${glows[background]}`}
      />
      <div className="relative z-10 mx-auto max-w-3xl">
        {eyebrow && (
          <p className={`mb-3 text-xs font-bold uppercase tracking-widest ${accents[background]}`}>
            {eyebrow}
          </p>
        )}
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mb-8 max-w-xl text-base text-white/60 sm:text-lg">
            {subtitle}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {ctaLabel && (
            <a
              href={ctaHref || "#"}
              className={`inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold transition ${ctaColors[background]}`}
            >
              {ctaLabel}
            </a>
          )}
          {secondaryLabel && (
            <a
              href={secondaryHref || "#"}
              className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {secondaryLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
