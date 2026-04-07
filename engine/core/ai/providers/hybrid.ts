import { googleProvider } from "./google";
import { groqProvider } from "./groq";
import { openrouterProvider } from "./openrouter";

/**
 * Expert Developer Strategy:
 * Use GROQ for fast, cost-effective inference by default
 * Keep Google as an option for vision/code tasks
 * Keep OpenRouter as a fallback or user-choice option.
 */
export const getAIProvider = (preference: string = "groq") => {
  if (preference === "google") return googleProvider;
  if (preference === "openrouter") return openrouterProvider;
  return groqProvider;
};

