/**
 * Egyptian Language Module (Romanized)
 *
 * This version supports:
 *  - Core dictionary translations
 *  - Phonetic Egyptianization for ANY English word
 *  - Deterministic fallback mapping
 */

export const EGYPTIAN_LANGUAGE_CODE = "egy";

/**
 * Core symbolic dictionary.
 */
const CORE_DICT: Record<string, string> = {
  life: "ankh",
  good: "nfr",
  beautiful: "nfr",
  truth: "maat",
  order: "maat",
  stability: "djed",
  power: "sekhem",
  magic: "heka",
  spirit: "ka",
  soul: "ba",
  heart: "ib",
  king: "nswt",
  queen: "hmt-nswt",
  sun: "ra",
  god: "ntr",
  gods: "ntrw",
};

/**
 * Egyptian phonetic syllables for fallback generation.
 */
const SYLLABLES = ["ka", "ba", "ra", "ma", "sa", "ta", "na", "ha", "pa", "fa"];

/**
 * Deterministic hash → syllables
 */
function egyptianizeWord(word: string): string {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = (hash * 31 + word.charCodeAt(i)) % 9999;
  }

  const syllableCount = Math.max(1, Math.min(3, Math.floor(word.length / 3)));

  let result = "";
  for (let i = 0; i < syllableCount; i++) {
    const index = (hash + i * 17) % SYLLABLES.length;
    result += SYLLABLES[index];
  }

  return result;
}

/**
 * Convert English → Egyptian (supports ANY word).
 */
export function toEgyptian(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();

      // 1. Core dictionary
      if (CORE_DICT[lower]) return CORE_DICT[lower];

      // 2. Already Egyptian
      if (detectEgyptian(word)) return word;

      // 3. Phonetic fallback
      return egyptianizeWord(lower);
    })
    .join(" ");
}

/**
 * Detect romanized Egyptian.
 */
export function detectEgyptian(text: string): boolean {
  return /\b(ankh|nfr|maat|djed|heka|ka|ba|ib|ntr|ntrw|ra)\b/i.test(text);
}

/**
 * Normalize for UI + voice.
 */
export function normalizeEgyptian(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Entry point used by translator.ts
 */
export function translateToEgyptianIfNeeded(text: string, targetLang: string): string {
  if (targetLang !== EGYPTIAN_LANGUAGE_CODE) return text;
  return toEgyptian(text);
}
