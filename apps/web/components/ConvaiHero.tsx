"use client";

import { useEffect, useRef, useState } from "react";
import { createNpcProviderFromEnv } from "@/lib/ai/convaiNpcProvider";

type ConvaiHeroProps = {
  characterId?: string;
};

const LOOP_MESSAGES = [
  "Welcome to AI-Wonderland! I'm your 3D assistant.",
  "We build websites, games, and full-stack apps with AI.",
  "Our WebContainer IDE runs directly in your browser - no setup needed.",
  "Create 3D experiences with our PlayCanvas integration.",
  "From idea to deployment, we handle the entire stack.",
  "Choose from Free, Pro at $39/month, or Team at $129/month.",
  "Ready to build something amazing? Let's get started!",
];

export default function ConvaiHero({ characterId }: ConvaiHeroProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const providerRef = useRef<any>(null);
  const sessionRef = useRef<string | null>(null);
  const loopIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const env = {
      NEXT_PUBLIC_ENABLE_CONVAI_NPC: process.env.NEXT_PUBLIC_ENABLE_CONVAI_NPC,
      NEXT_PUBLIC_CONVAI_CHARACTER_ID: characterId || process.env.NEXT_PUBLIC_CONVAI_CHARACTER_ID,
    };

    const provider = createNpcProviderFromEnv(env);
    providerRef.current = provider;
    setIsConfigured(provider.isConfigured);

    if (!provider.isConfigured) return;

    let mounted = true;

    provider.createSession().then((session: any) => {
      if (!mounted) return;
      sessionRef.current = session.sessionId;

      // Subscribe to responses
      provider.subscribeNpcResponses(session.sessionId, (response: any) => {
        setCurrentMessage(response.text);
        setIsSpeaking(false);
      });

      // Start the loop
      startLoop(session.sessionId, provider);
    });

    return () => {
      mounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [characterId]);

  const startLoop = async (sessionId: string, provider: any) => {
    const sendMessage = async (index: number) => {
      if (!providerRef.current) return;

      setIsSpeaking(true);
      setCurrentMessage(LOOP_MESSAGES[index]);

      try {
        await providerRef.current.sendUserUtterance(sessionId, LOOP_MESSAGES[index]);
      } catch (e) {
        setIsSpeaking(false);
      }

      // Wait before next message
      loopIndexRef.current = (index + 1) % LOOP_MESSAGES.length;
      timeoutRef.current = setTimeout(
        () => sendMessage(loopIndexRef.current),
        LOOP_MESSAGES[index].length * 100 + 3000 // Read time + pause
      );
    };

    sendMessage(0);
  };

  if (!isConfigured) {
    // Fallback: display messages without Convai
    useEffect(() => {
      const loop = () => {
        setCurrentMessage(LOOP_MESSAGES[loopIndexRef.current]);
        loopIndexRef.current = (loopIndexRef.current + 1) % LOOP_MESSAGES.length;
        timeoutRef.current = setTimeout(loop, 5000);
      };
      loop();
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 3D Character Placeholder - Replace with your 3D model */}
      <div className="relative mb-8">
        <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center animate-pulse">
          <div className="text-6xl">🤖</div>
        </div>
        {isSpeaking && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Speech Bubble */}
      <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/5 border-t border-l border-white/10 rotate-45" />
        <p className="text-lg text-white/90 min-h-[3em] transition-opacity">
          {currentMessage || "Loading..."}
        </p>
      </div>

      {/* Status */}
      <p className="mt-4 text-center text-sm text-white/40">
        {isConfigured ? "🎤 Convai 3D Assistant Active" : "💬 AI-Wonderland Assistant"}
      </p>
    </div>
  );
}
