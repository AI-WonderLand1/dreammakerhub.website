import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { env, requireEnv } from "@lib/env";
import { logger } from "@lib/logger";

export const opencodeProvider: AIProvider = {
  name: "opencode",

  async generate(prompt: string | any[], options: AIProviderOptions): Promise<AIResponse> {
    const apiKey = requireEnv(env.OPENCODE_API_KEY, "OPENCODE_API_KEY");
    const {
      model = "opencode/big-pickle",
      system,
      temperature = 0.7,
      maxTokens = 4096
    } = options ?? {};

    try {
      const messages = [];

      if (system) {
        messages.push({ role: "system", content: system });
      }

      messages.push({
        role: "user",
        content: Array.isArray(prompt) ? JSON.stringify(prompt) : String(prompt)
      });

      const response = await fetch("https://opencode.ai/v1/chat/completions", {
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
        logger.error("OpenCode API Error", { error: data.error });
        return {
          text: "The Spirit Guide encountered an error with OpenCode API.",
          error: true,
          provider: "opencode",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["OpenCode API returned an error"],
            limitations: [data.error.message || "Unknown error"]
          }
        };
      }

      if (!data.choices?.length) {
        logger.error("OpenCode API returned no choices", { data });
        return {
          text: "The Spirit Guide received no response from OpenCode API.",
          error: true,
          provider: "opencode",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["No choices returned from OpenCode API"],
            limitations: ["Empty response"]
          }
        };
      }

      const outputText = data.choices[0].message.content;

      return {
        text: outputText,
        provider: "opencode",
        model,
        confessions: {
          confidence: 0.95,
          reasoning: ["Processed via OpenCode API"],
          limitations: ["May have usage limits"]
        }
      };
    } catch (error: any) {
      logger.error("Spirit Guide Connection Severed (OpenCode)", {
        error: error?.message ?? error
      });

      return {
        text: "The Spirit Guide lost connection to OpenCode API.",
        error: true,
        provider: "opencode",
        model,
        confessions: {
          confidence: 0,
          reasoning: ["Network or infrastructure failure"],
          limitations: [error?.message ?? "Unknown network error"]
        }
      };
    }
  },
};