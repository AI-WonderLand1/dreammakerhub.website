/**
 * Wonderland Voice Profiles
 *
 * This module selects the correct voice for:
 *  - English
 *  - Spanish
 *  - French
 *  - German
 *  - Chinese
 *  - Japanese
 *  - Korean
 *  - Egyptian (romanized)
 *
 * Egyptian uses a special soft‑spoken neutral voice
 * because TTS engines struggle with harsh consonants.
 */

import { EGYPTIAN_LANGUAGE_CODE, normalizeEgyptian } from "./egyptian";

export interface VoiceProfile {
  id: string;          // internal voice ID
  label: string;       // human-readable name
  language: string;    // "en", "es", "egy", etc.
  pitch?: number;      // optional tuning
  rate?: number;       // optional tuning
}

/**
 * Voice registry.
 * You can swap these IDs for your actual TTS provider.
 */
const VOICES: Record<string, VoiceProfile> = {
  en: {
    id: "wonderland-voice-en-1",
    label: "Wonderland English",
    language: "en",
    pitch: 1.0,
    rate: 1.0,
  },
  es: {
    id: "wonderland-voice-es-1",
    label: "Wonderland Spanish",
    language: "es",
    pitch: 1.0,
    rate: 1.0,
  },
  fr: {
    id: "wonderland-voice-fr-1",
    label: "Wonderland French",
    language: "fr",
    pitch: 1.0,
    rate: 1.0,
  },
  de: {
    id: "wonderland-voice-de-1",
    label: "Wonderland German",
    language: "de",
    pitch: 1.0,
    rate: 1.0,
  },
  zh: {
    id: "wonderland-voice-zh-1",
    label: "Wonderland Chinese",
    language: "zh",
    pitch: 1.0,
    rate: 1.0,
  },
  ja: {
    id: "wonderland-voice-ja-1",
    label: "Wonderland Japanese",
    language: "ja",
    pitch: 1.0,
    rate: 1.0,
  },
  ko: {
    id: "wonderland-voice-ko-1",
    label: "Wonderland Korean",
    language: "ko",
    pitch: 1.0,
    rate: 1.0,
  },

  /**
   * Egyptian (romanized)
   *
   * This voice is intentionally:
   *  - softer
   *  - slower
   *  - smoother
   *
   * Because romanized Egyptian has:
   *  - many open vowels
   *  - fewer harsh consonants
   *  - rhythmic syllables
   */
  [EGYPTIAN_LANGUAGE_CODE]: {
    id: "wonderland-voice-egy-1",
    label: "Wonderland Egyptian (Romanized)",
    language: EGYPTIAN_LANGUAGE_CODE,
    pitch: 0.9,
    rate: 0.92,
  },
};

/**
 * Get the correct voice for a given language.
 */
export function getVoiceForLanguage(lang: string): VoiceProfile {
  if (VOICES[lang]) return VOICES[lang];

  // fallback to English
  return VOICES["en"];
}

/**
 * Normalize text for TTS.
 * Egyptian needs special handling.
 */
export function prepareTextForVoice(text: string, lang: string): string {
  if (lang === EGYPTIAN_LANGUAGE_CODE) {
    return normalizeEgyptian(text);
  }

  return text.trim();
}

/**
 * High-level helper used by AIConsoleVoice.ts
 */
export function getVoiceAndText(text: string, lang: string) {
  const voice = getVoiceForLanguage(lang);
  const prepared = prepareTextForVoice(text, lang);

  return {
    voice,
    text: prepared,
  };
}
