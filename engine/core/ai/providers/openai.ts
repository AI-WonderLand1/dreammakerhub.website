import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { env } from "@lib/env";
import { logger } from "@lib/logger";

export const openaiProvider: AIProvider = {
  name: "openai",

  async generate(prompt: string | unknown[], options: AIProviderOptions): Promise<AIResponse> {
    const apiKey = options.apiKey as string || process.env.OPENAI_API_KEY || '';
    const {
      model = "gpt-4o-mini",
      system,
      temperature = 0.7,
      maxTokens = 4096
    } = options ?? {};

    if (!apiKey) {
      // No OpenAI key – fall back to OpenRouter
      const fallback = await import('./openrouter').then(m => m.openrouterProvider.generate(prompt, options));
      return {
        text: fallback.text || "Falling back to OpenRouter model",
        ...fallback,
        provider: "openai",
        confessions: {
          ...fallback.confessions,
          reasoning: ["Fallback to OpenRouter due to missing OpenAI key"]
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

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
        logger.error("OpenAI API Error", { error: data.error });
        return {
          text: "OpenAI API returned an error.",
          error: true,
          provider: "openai",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["OpenAI API returned an error"],
            limitations: [data.error.message || "Unknown error"]
          }
        };
      }

      if (!data.choices?.length) {
        logger.error("OpenAI API returned no choices", { data });
        return {
          text: "No response from OpenAI API.",
          error: true,
          provider: "openai",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["No choices returned from OpenAI API"],
            limitations: ["Empty response"]
          }
        };
      }

      const outputText = data.choices[0].message.content;

      return {
        text: outputText,
        provider: "openai",
        model,
        confessions: {
          confidence: 0.95,
          reasoning: ["Processed via OpenAI API"],
          limitations: ["May have usage limits"]
        }
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown network error";
      logger.error("OpenAI connection error", { error: errMsg });

      return {
        text: "Lost connection to OpenAI API.",
        error: true,
        provider: "openai",
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
