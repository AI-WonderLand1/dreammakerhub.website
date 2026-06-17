import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { logger } from "@lib/logger";

export const customApiProvider: AIProvider = {
  name: "custom-api",

  async generate(prompt: string | unknown[], options: AIProviderOptions): Promise<AIResponse> {
    const apiKey = options.apiKey as string || '';
    const baseUrl = (options.baseUrl as string || '').replace(/\/$/, '');
    const {
      model = "custom-model",
      system,
      temperature = 0.7,
      maxTokens = 4096
    } = options ?? {};

    if (!apiKey) {
      return {
        text: "Custom API key not configured. Add it in Settings → AI Providers.",
        error: true,
        provider: "custom-api",
        model,
        confessions: {
          confidence: 0,
          reasoning: ["Custom API key missing"],
          limitations: ["Set API key in Settings → AI Providers"]
        }
      };
    }

    if (!baseUrl) {
      return {
        text: "Custom API base URL not configured.",
        error: true,
        provider: "custom-api",
        model,
        confessions: {
          confidence: 0,
          reasoning: ["Custom API base URL missing"],
          limitations: ["Set a base URL in Settings → AI Providers"]
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

      const response = await fetch(`${baseUrl}/chat/completions`, {
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
        logger.error("Custom API Error", { error: data.error });
        return {
          text: "Custom API returned an error.",
          error: true,
          provider: "custom-api",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["Custom API returned an error"],
            limitations: [data.error.message || "Unknown error"]
          }
        };
      }

      if (!data.choices?.length) {
        logger.error("Custom API returned no choices", { data });
        return {
          text: "No response from Custom API.",
          error: true,
          provider: "custom-api",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["No choices returned from Custom API"],
            limitations: ["Empty response"]
          }
        };
      }

      const outputText = data.choices[0].message.content;

      return {
        text: outputText,
        provider: "custom-api",
        model,
        confessions: {
          confidence: 0.95,
          reasoning: ["Processed via Custom API"],
          limitations: ["Depends on the configured endpoint"]
        }
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown network error";
      logger.error("Custom API connection error", { error: errMsg });

      return {
        text: "Lost connection to Custom API.",
        error: true,
        provider: "custom-api",
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
