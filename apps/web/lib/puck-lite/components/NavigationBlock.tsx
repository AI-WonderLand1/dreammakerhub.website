"use client";

export type NavigationBlockProps = {
  logo: string;
  links: string;
  ctaLabel: string;
  ctaHref: string;
  theme: "dark" | "glass" | "neon";
};

const themes = {
  dark: "border-white/10 bg-black/80 backdrop-blur-md",
  glass: "border-white/10 bg-white/5 backdrop-blur-md",
  neon: "border-cyan-500/20 bg-black/80 backdrop-blur-md",
};

const ctaThemes = {
  dark: "bg-violet-600 hover:bg-violet-500 text-white",
  glass: "bg-white text-black hover:bg-white/90",
  neon: "bg-cyan-500 hover:bg-cyan-400 text-black",
};

export default function NavigationBlock({
  logo = "AI Wonderland",
  links = "Features, Pricing, Docs, Community",
  ctaLabel = "Get Started",
  ctaHref = "/public-pages/auth",
  theme = "dark",
}: NavigationBlockProps) {
  const navLinks = links
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="p-4" data-block="navigation">
      <nav className={`flex items-center justify-between rounded-2xl border px-5 py-3 ${themes[theme]}`}>
        <span className="text-sm font-extrabold tracking-tight text-white">{logo}</span>

        <div className="hidden items-center gap-5 sm:flex">
          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="text-xs font-medium text-white/60 transition hover:text-white"
            >
              {link}
            </a>
          ))}
        </div>

        <a
          href={ctaHref}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${ctaThemes[theme]}`}
        >
          {ctaLabel}
        </a>
      </nav>
    </div>
  );
}
