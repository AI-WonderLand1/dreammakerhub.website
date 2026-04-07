import { googleProvider } from "./google";
import { githubProvider } from "./github";
import { groqProvider } from "./groq";
import { openrouterProvider } from "./openrouter";

/**
 * Expert Developer Strategy:
 * Use GitHub Models as the primary provider (via Azure OpenAI)
 * Keep Google as an option for vision/code tasks
 * Keep GROQ as a fast alternative
 * Keep OpenRouter as a fallback or user-choice option.
 */
export const getAIProvider = (preference: string = "github") => {
  if (preference === "google") return googleProvider;
  if (preference === "groq") return groqProvider;
  if (preference === "openrouter") return openrouterProvider;
  return githubProvider;
};

