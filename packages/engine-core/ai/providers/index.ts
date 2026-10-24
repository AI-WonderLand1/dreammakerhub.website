import { googleProvider } from "./google";
import { githubProvider } from "./github";
import { groqProvider } from "./groq";
import { openrouterProvider } from "./openrouter";
import { opencodeProvider } from "./opencode";
import { n8nProvider } from "./n8n";
import { cerebrasProvider } from "./cerebras";
import { openaiProvider } from "./openai";
import { anthropicProvider } from "./anthropic";
import { customApiProvider } from "./custom-api";
import { webhookProvider } from "./webhook";
import { dreammakerhubProvider } from "./dreammakerhub";

export const Providers = {
  google: googleProvider,
  github: githubProvider,
  groq: groqProvider,
  openrouter: openrouterProvider,
  opencode: opencodeProvider,
  n8n: n8nProvider,
  cerebras: cerebrasProvider,
  openai: openaiProvider,
  anthropic: anthropicProvider,
  "custom-api": customApiProvider,
  webhook: webhookProvider,
  dreammakerhub: dreammakerhubProvider,
};
