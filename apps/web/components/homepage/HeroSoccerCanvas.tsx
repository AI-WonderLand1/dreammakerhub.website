"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useWelcomeGreeting, setVoiceEnabled } from "./heroVoice";

const SoccerHeroScene = dynamic(() => import("./SoccerHeroScene"), {
  ssr: false,
  loading: () => null,
});

interface HeroSoccerCanvasProps {
  welcomeMessage?: string;
  voiceOn?: boolean;
  onToggleVoice?: (enabled: boolean) => void;
}

export default function HeroSoccerCanvas({
  welcomeMessage = "Welcome to AI Wonderland, the home of innovation. Let your imagination run wild.",
  voiceOn = true,
  onToggleVoice,
}: HeroSoccerCanvasProps) {
  useWelcomeGreeting(welcomeMessage);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,#0b1b3a_0%,#05060f_55%,#000_100%)]" />
      <Image
        src="/images/wonderland-background.png"
        alt=""
        fill
        priority
        className="object-cover object-left opacity-20"
        sizes="100vw"
      />
      <div className="absolute inset-0">
        <SoccerHeroScene />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85" />

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