import Link from "next/link";
import F6SFollowBadge from "@/components/F6SFollowBadge";
import TrustpilotReviewCollector from "@/components/TrustpilotReviewCollector";

const PRODUCT_LINKS = [
  { label: "Build", href: "/wonder-build" },
  { label: "Code", href: "/wonderspace" },
  { label: "3D", href: "/dashboard/3dhub" },
] as const;

const SUPPORT_LINKS = [
  { label: "Projects", href: "/dashboard/projects" },
  { label: "Docs", href: "/docs" },
  { label: "Support", href: "/contact" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
] as const;

export default function Footer() {
  return (
    <footer className="relative isolate overflow-hidden border-t border-cyan-100/25 bg-[#071326]/25 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl">
      {/* Translucent, irregular glass facets. Decorative layers never intercept links. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: [
            "linear-gradient(125deg, transparent 24.86%, rgba(186,230,253,0.38) 25%, transparent 25.14%)",
            "linear-gradient(43deg, transparent 57.87%, rgba(255,255,255,0.25) 58%, transparent 58.13%)",
            "linear-gradient(155deg, transparent 71.86%, rgba(167,139,250,0.34) 72%, transparent 72.14%)",
            "linear-gradient(18deg, transparent 37.87%, rgba(186,230,253,0.25) 38%, transparent 38.13%)",
          ].join(", "),
          backgroundSize: "660px 310px, 540px 280px, 800px 340px, 720px 320px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[46%] bg-sky-100/[0.035]"
        style={{ clipPath: "polygon(0 0, 74% 0, 100% 39%, 42% 100%, 0 78%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-violet-200/[0.055]"
        style={{ clipPath: "polygon(25% 0, 100% 0, 100% 100%, 0 68%, 57% 37%)" }}
      />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5 px-6 py-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/" className="text-lg font-bold text-white">
            AI Wonderland
          </Link>
          <p className="mt-1 text-sm text-white/45">
            Build websites, code, and 3D experiences with AI.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
          {PRODUCT_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="font-semibold text-white/70 transition hover:text-white">
              {item.label}
            </Link>
          ))}
          <span className="hidden text-white/15 sm:inline">|</span>
          {SUPPORT_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="text-white/50 transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-6">
        <div className="max-w-sm">
          <p className="mb-2 text-xs text-white/50">Share your experience with DreamMakerHub</p>
          <TrustpilotReviewCollector />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-3 border-t border-white/[0.07] px-6 py-4 text-center text-xs text-white/45 sm:flex-row">
        <span>© {new Date().getFullYear()} AI Wonderland. All rights reserved.</span>
        <span className="hidden text-white/20 sm:inline" aria-hidden="true">|</span>
        <span className="flex items-center gap-2">
          <span>Follow our founder</span>
          <F6SFollowBadge />
        </span>
      </div>
    </footer>
  );
}
