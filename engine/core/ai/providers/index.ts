import { googleProvider } from "./google";
import { githubProvider } from "./github";
import { groqProvider } from "./groq";
import { openrouterProvider } from "./openrouter";

export const Providers = {
  google: googleProvider,
  github: githubProvider,
  groq: groqProvider,
  openrouter: openrouterProvider,
};
