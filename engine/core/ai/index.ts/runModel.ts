import "server-only";
import { openrouterProvider } from "./providers/openrouter";
import { googleProvider } from "./providers/google";
import type { AIProvider, RunModelOptions } from "./types";

const PROVIDERS: Record<string, AIProvider> = {
  openrouter: openrouterProvider,
  google: googleProvider,
};

export async function runModel(prompt: string, options: RunModelOptions) {
  const { model } = options;

  if (!model) {
    throw new Error("runModel: 'model' is required");
  }

  // model format: "openrouter:anthropic/claude-3"
  const [providerName, providerModel] = model.split(":");

  const provider = PROVIDERS[providerName];
  if (!provider) {
    throw new Error(`Unknown AI provider: ${providerName}`);
  }

  return provider.generate(prompt, {
    ...options,
    model: providerModel, // pass only the model name to provider
  });
    }
