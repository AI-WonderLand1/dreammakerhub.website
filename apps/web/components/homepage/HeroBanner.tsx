"use client";

import Image from "next/image";

export default function HeroBanner() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#030409]" aria-hidden="true">
      <Image
        src="/images/hero-victorized-bg.webp"
        alt=""
        fill
        priority
        className="scale-[1.03] object-cover object-center"
        sizes="100vw"
      />

      {/* Night treatment at the top. Lower homepage sections add translucent daylight layers
          over this same fixed scene so it feels like the world moves from night into day. */}
      <div className="absolute inset-0 bg-[#020511]/55" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.20),transparent_28%),radial-gradient(circle_at_78%_22%,rgba(168,85,247,0.24),transparent_34%),radial-gradient(circle_at_52%_76%,rgba(59,130,246,0.16),transparent_40%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020511]/75 via-[#08132f]/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#87add8]/55 via-[#31558a]/22 to-transparent" />
    </div>
  );
}
