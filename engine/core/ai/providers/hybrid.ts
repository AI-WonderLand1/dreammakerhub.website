import { googleProvider } from "./google";
import { openrouterProvider } from "./openrouter";

/**
 * Expert Developer Strategy: 
 * Use Google for free high-logic tasks (Vision/Code)
 * Keep OpenRouter as a fallback or user-choice option.
 */
export const getAIProvider = (preference: string = "google") => {
  if (preference === "openrouter") return openrouterProvider;
  return googleProvider;
};

