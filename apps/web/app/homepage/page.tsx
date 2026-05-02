import Link from "next/link";
import ConvaiHero from "@/components/ConvaiHero";

export default function HomepagePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-5xl w-full">
        {/* Convai 3D AI Character */}
        <ConvaiHero />

        {/* Action Buttons */}
        <div className="mt-12 flex gap-4 justify-center">
          <Link
            href="/subscription"
            className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            View Plans
          </Link>
          <Link
            href="/public-pages/auth"
            className="rounded-xl border border-white/20 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Get Started
          </Link>
        </div>

        {/* Comparison Badge */}
        <p className="mt-8 text-center text-sm text-white/40">
          The only platform with IDE + 3D Engine + AI Builder in one place
        </p>
      </div>
    </div>
  );
}
