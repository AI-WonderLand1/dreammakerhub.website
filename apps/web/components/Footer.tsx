import Link from "next/link";

const PRODUCT_LINKS = [
  { label: "Build", href: "/wonder-build" },
  { label: "Code", href: "/wonderspace" },
  { label: "3D", href: "/dashboard/3dhub" },
] as const;

const SUPPORT_LINKS = [
  { label: "Projects", href: "/dashboard/projects" },
  { label: "Docs", href: "/docs" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-7 lg:flex-row lg:items-center lg:justify-between">
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

      <div className="border-t border-white/[0.07] px-6 py-4 text-center text-xs text-white/35">
        © {new Date().getFullYear()} AI Wonderland. All rights reserved.
      </div>
    </footer>
  );
}
