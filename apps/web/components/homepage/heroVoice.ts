"use client";

import { useEffect, useRef } from "react";

let voiceEnabled = true;

export function setVoiceEnabled(enabled: boolean) {
  voiceEnabled = enabled;
  if (!enabled && typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /en(-|_)US/i.test(v.lang) && /female|samantha|aria|zira|google us english/i.test(v.name)) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith("en")) ||
    null
  );
}

export function speak(text: string, opts: { rate?: number; pitch?: number } = {}) {
  if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang || "en-US";
  utterance.rate = opts.rate ?? 1.02;
  utterance.pitch = opts.pitch ?? 1.05;
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function useWelcomeGreeting(message: string, delayMs = 900) {
  const greeted = useRef(false);

  useEffect(() => {
    if (greeted.current) return;
    const timeout = window.setTimeout(() => {
      speak(message);
      greeted.current = true;
    }, delayMs);

    // Browsers block speech until a user gesture — greet on first interaction as a fallback.
    const unlock = () => {
      if (!greeted.current) {
        speak(message);
        greeted.current = true;
      }
      window.removeEventListener("pointerdown", unlock);
      window.clearTimeout(timeout);
    };
    window.addEventListener("pointerdown", unlock);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("pointerdown", unlock);
    };
  }, [message, delayMs]);
}