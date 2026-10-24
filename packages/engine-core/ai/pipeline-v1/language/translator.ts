/**
 * Wonderland Language Translator
 *
 * This module handles:
 *  - Human language detection
 *  - Translation routing
 *  - Egyptian romanization
 *  - Normalization for UI + voice
 *
 * Supported languages:
 *  - en (English)
 *  - es (Spanish)
 *  - fr (French)
 *  - de (German)
 *  - zh (Chinese)
 *  - ja (Japanese)
 *  - ko (Korean)
 *  - egy (Romanized Ancient Egyptian)
 */

import {
  translateToEgyptianIfNeeded,
  normalizeEgyptian,
  EGYPTIAN_LANGUAGE_CODE,
} from "./egyptian";

/**
 * Detect human language from text.
 * This is intentionally simple — Wonderland does not need heavy NLP here.
 */
export function detectHumanLanguage(text: unknown): string {
  if (typeof text !== "string" || !text.trim()) return "en";

  const t = text.toLowerCase();

  if (/[\u4e00-\u9fa5]/.test(t)) return "zh"; // Chinese
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(t)) return "ja"; // Japanese
  if (/\b(hola|gracias|buenos)\b/.test(t)) return "es"; // Spanish
  if (/\b(danke|hallo|bitte)\b/.test(t)) return "de"; // German
  if (/\b(merci|bonjour)\b/.test(t)) return "fr"; // French
  if (/\b(annyeong|gomawo)\b/.test(t)) return "ko"; // Korean

  return "en";
}

/**
 * Normalize text for UI + voice.
 */
export function normalizeText(text: unknown, lang: unknown): string {
  if (typeof text !== "string") return "";

  const safeLang = typeof lang === "string" ? lang : "en";

  if (safeLang === EGYPTIAN_LANGUAGE_CODE) {
    return normalizeEgyptian(text);
  }

  return text.trim();
}

/**
 * Main translation entry point.
 *
 * The pipeline calls this AFTER the model responds,
 * so the final output is always in the user's target language.
 */
export function translateOutput(text: unknown, targetLang: unknown): string {
  if (typeof text !== "string") return "";

  const safeTarget = typeof targetLang === "string" ? targetLang : "en";

  // Egyptian romanization
  if (safeTarget === EGYPTIAN_LANGUAGE_CODE) {
    return translateToEgyptianIfNeeded(text, safeTarget);
  }

  // For now, Wonderland does NOT auto-translate between human languages.
  return text;
}

/**
 * Translate user input BEFORE sending to the model (optional).
 * Currently unused, but included for future expansion.
 */
export function translateInput(text: unknown, sourceLang: unknown): string {
  if (typeof text !== "string") return "";

  const safeSource = typeof sourceLang === "string" ? sourceLang : "en";

  // Egyptian → English fallback
  if (safeSource === EGYPTIAN_LANGUAGE_CODE) {
    return text;
  }

  return text;
}

/**
 * High-level helper used by pipeline + engine.
 */
export function processLanguage(text: unknown, targetLang: unknown): string {
  if (typeof text !== "string") return "";

  const safeTarget = typeof targetLang === "string" ? targetLang : "en";

  const translated = translateOutput(text, safeTarget);
  return normalizeText(translated, safeTarget);
}
