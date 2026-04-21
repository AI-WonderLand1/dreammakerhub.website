import { googleProvider } from "./google";
import { githubProvider } from "./github";
import { groqProvider } from "./groq";
import { openrouterProvider } from "./openrouter";
import { opencodeProvider } from "./opencode";

export const Providers = {
  google: googleProvider,
  github: githubProvider,
  groq: groqProvider,
  openrouter: openrouterProvider,
  opencode: opencodeProvider,
};
