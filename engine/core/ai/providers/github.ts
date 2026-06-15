import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { logger } from "@lib/logger";

/**
 * GitHub Models Provider (via Azure OpenAI)
 * Uses GitHub Models accessible through Azure OpenAI endpoints.
 */
export const githubProvider: AIProvider = {
  name: "github",

  async generate(prompt: string | unknown[], options: AIProviderOptions): Promise<AIResponse> {
    const apiKey = process.env.GITHUB_MODELS_API_KEY || '';
    const {
      model = "gpt-4o-mini",
      system,
      temperature = 0.7,
      maxTokens = 4096
    } = options ?? {};

    if (!apiKey) {
      return {
        text: "GITHUB_MODELS_API_KEY not configured. Add it to Railway.",
        error: true,
        provider: "github",
        model,
        confessions: {
          confidence: 0,
          reasoning: ["GITHUB_MODELS_API_KEY missing"],
          limitations: ["Set GITHUB_MODELS_API_KEY in Railway environment"]
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

      // GitHub Models use Azure OpenAI endpoints
      const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
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
        logger.error("❌ GitHub Models API Error", { error: data.error });
        return {
          text: "The Spirit Guide encountered an error with GitHub Models API.",
          error: true,
          provider: "github",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["GitHub Models API returned an error"],
            limitations: [data.error.message || "Unknown error"]
          }
        };
      }

      if (!data.choices?.length) {
        logger.error("❌ GitHub Models API returned no choices", { data });
        return {
          text: "The Spirit Guide received no response from GitHub Models API.",
          error: true,
          provider: "github",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["No choices returned from GitHub Models API"],
            limitations: ["Empty response"]
          }
        };
      }

      const outputText = data.choices[0].message.content;

      return {
        text: outputText,
        provider: "github",
        model,
        confessions: {
          confidence: 0.95,
          reasoning: ["Processed via GitHub Models API"],
          limitations: ["May have usage limits"]
        }
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown network error";
      logger.error("✦ Spirit Guide Connection Severed (GitHub Models)", {
        error: errMsg
      });

      return {
        text: "The Spirit Guide lost connection to GitHub Models API.",
        error: true,
        provider: "github",
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