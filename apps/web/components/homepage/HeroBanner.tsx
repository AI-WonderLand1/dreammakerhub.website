"use client";

import Image from "next/image";

export default function HeroBanner() {
  return (
    <div className="absolute inset-0">
      <Image
        src="/images/hero-victorized-bg.webp"
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-black/85" />
    </div>
  );
}
