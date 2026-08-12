"use client";

import Image from "next/image";
import { useWelcomeGreeting, setVoiceEnabled } from "./heroVoice";

interface HeroBannerProps {
  voiceOn?: boolean;
  onToggleVoice?: (enabled: boolean) => void;
}

export default function HeroBanner({
  voiceOn = true,
  onToggleVoice,
}: HeroBannerProps) {
  useWelcomeGreeting("Welcome to AI Wonderland, the home of innovation. Let your imagination run wild.");

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

      <button
        type="button"
        onClick={() => {
          const next = !voiceOn;
          setVoiceEnabled(next);
          onToggleVoice?.(next);
        }}
        aria-pressed={voiceOn}
        title={voiceOn ? "Mute welcome voice" : "Unmute welcome voice"}
        className="absolute bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur-md transition hover:bg-black/60 hover:text-white"
      >
        <span className={voiceOn ? "" : "opacity-40"}>🔊</span>
        {voiceOn ? "Voice On" : "Voice Off"}
      </button>
    </div>
  );
}
