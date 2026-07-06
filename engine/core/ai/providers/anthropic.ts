import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { env } from "@lib/env";
import { logger } from "@lib/logger";

export const anthropicProvider: AIProvider = {
  name: "anthropic",

  async generate(prompt: string | unknown[], options: AIProviderOptions): Promise<AIResponse> {
    const apiKey = options.apiKey as string || process.env.ANTHROPIC_API_KEY || '';
    const {
      model = "claude-3-5-haiku-latest",
      system,
      temperature = 0.7,
      maxTokens = 4096
    } = options ?? {};

    if (!apiKey) {
      return {
        text: "ANTHROPIC_API_KEY not configured. Add it in Settings → AI Providers.",
        error: true,
        provider: "anthropic",
        model,
        confessions: {
          confidence: 0,
          reasoning: ["ANTHROPIC_API_KEY missing"],
          limitations: ["Set ANTHROPIC_API_KEY in Settings → AI Providers"]
        }
      };
    }

    try {
      const messages = [];

      messages.push({
        role: "user",
        content: Array.isArray(prompt) ? JSON.stringify(prompt) : String(prompt)
      });

      const body: Record<string, unknown> = {
        model,
        max_tokens: maxTokens,
        messages,
      };

      if (system) {
        body.system = system;
      }

      if (temperature !== undefined) {
        body.temperature = temperature;
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.error) {
        logger.error("Anthropic API Error", { error: data.error });
        return {
          text: "Anthropic API returned an error.",
          error: true,
          provider: "anthropic",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["Anthropic API returned an error"],
            limitations: [data.error.message || "Unknown error"]
          }
        };
      }

      if (!data.content?.length) {
        logger.error("Anthropic API returned no content", { data });
        return {
          text: "No response from Anthropic API.",
          error: true,
          provider: "anthropic",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["No content returned from Anthropic API"],
            limitations: ["Empty response"]
          }
        };
      }

      const outputText = data.content.map((c: { text?: string }) => c.text || '').join('');

      return {
        text: outputText,
        provider: "anthropic",
        model,
        confessions: {
          confidence: 0.95,
          reasoning: ["Processed via Anthropic API"],
          limitations: ["May have usage limits"]
        }
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown network error";
      logger.error("Anthropic connection error", { error: errMsg });

      return {
        text: "Lost connection to Anthropic API.",
        error: true,
        provider: "anthropic",
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
