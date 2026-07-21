import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { logger } from "@lib/logger";

/**
 * OpenRouter Provider
 * Routes requests to many models via openrouter.ai
 * Uses OPENROUTER_API_KEY secret or user-provided apiKey.
 */
export const openrouterProvider: AIProvider = {
  name: "openrouter",

  async generate(prompt: string | unknown[], options: AIProviderOptions): Promise<AIResponse> {
    const apiKey = options.apiKey as string || process.env.OPENROUTER_API_KEY || '';
    const {
      model = "google/gemini-flash-1.5",
      system,
      temperature = 0.7,
      maxTokens = 4096
    } = options ?? {};

if (!apiKey) {
      return {
        text: "No API key configured. Get a free key at https://openrouter.ai/keys and set OPENROUTER_API_KEY in your environment.",
        error: true,
        provider: "openrouter",
        confessions: {
          confidence: 0,
          reasoning: ["Missing API key"],
          limitations: ["Get a free key at https://openrouter.ai/keys"]
        }
      };
    }

    try {
      const messages: { role: string; content: string }[] = [];
      if (system) messages.push({ role: "system", content: system });
      messages.push({
        role: "user",
        content: Array.isArray(prompt) ? JSON.stringify(prompt) : String(prompt)
      });

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.SITE_URL || process.env.NEXT_PUBLIC_URL || "https://dreammakerhub.website",
          "X-Title": "DreamMaker Hub",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      const data = await response.json();

      if (data.error) {
        logger.error("OpenRouter API Error", { error: data.error });
        return {
          text: "OpenRouter encountered an error.",
          error: true,
          provider: "openrouter",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["OpenRouter API returned an error"],
            limitations: [data.error.message || "Unknown error"]
          }
        };
      }

      if (!data.choices?.length) {
        return {
          text: "OpenRouter returned no response.",
          error: true,
          provider: "openrouter",
          model,
          confessions: { confidence: 0, reasoning: ["No choices returned"], limitations: [] }
        };
      }

      return {
        text: data.choices[0].message.content,
        provider: "openrouter",
        model,
        confessions: {
          confidence: 0.9,
          reasoning: ["Processed via OpenRouter"],
          limitations: []
        }
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("OpenRouter connection error", { error: errMsg });
      return {
        text: "OpenRouter connection failed.",
        error: true,
        provider: "openrouter",
        model,
        confessions: { confidence: 0, reasoning: ["Network error"], limitations: [errMsg] }
      };
    }
  },
};
