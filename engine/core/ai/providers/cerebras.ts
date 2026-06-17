import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { env } from "@lib/env";
import { logger } from "@lib/logger";

export const cerebrasProvider: AIProvider = {
  name: "cerebras",

  async generate(prompt: string | unknown[], options: AIProviderOptions): Promise<AIResponse> {
    const apiKey = options.apiKey as string || process.env.CEREBRAS_API_KEY || '';
    const {
      model = "llama-3.3-70b",
      system,
      temperature = 0.7,
      maxTokens = 4096
    } = options ?? {};

    if (!apiKey) {
      return {
        text: "CEREBRAS_API_KEY not configured. Add it in Settings → AI Providers.",
        error: true,
        provider: "cerebras",
        model,
        confessions: {
          confidence: 0,
          reasoning: ["CEREBRAS_API_KEY missing"],
          limitations: ["Set CEREBRAS_API_KEY in Settings → AI Providers"]
        }
      };
    }

    try {
      const messages = [];

      if (system) {
        messages.push({ role: "system", content: system });
      }

      messages.push({
        role: "user",
        content: Array.isArray(prompt) ? JSON.stringify(prompt) : String(prompt)
      });

      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
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
        logger.error("Cerebras API Error", { error: data.error });
        return {
          text: "Cerebras API returned an error.",
          error: true,
          provider: "cerebras",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["Cerebras API returned an error"],
            limitations: [data.error.message || "Unknown error"]
          }
        };
      }

      if (!data.choices?.length) {
        logger.error("Cerebras API returned no choices", { data });
        return {
          text: "No response from Cerebras API.",
          error: true,
          provider: "cerebras",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["No choices returned from Cerebras API"],
            limitations: ["Empty response"]
          }
        };
      }

      const outputText = data.choices[0].message.content;

      return {
        text: outputText,
        provider: "cerebras",
        model,
        confessions: {
          confidence: 0.95,
          reasoning: ["Processed via Cerebras API"],
          limitations: ["May have usage limits"]
        }
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown network error";
      logger.error("Cerebras connection error", { error: errMsg });

      return {
        text: "Lost connection to Cerebras API.",
        error: true,
        provider: "cerebras",
        model,
        confessions: {
          confidence: 0,
          reasoning: ["Network or infrastructure failure"],
          limitations: [errMsg]
        }
      };
    }
  },
};
