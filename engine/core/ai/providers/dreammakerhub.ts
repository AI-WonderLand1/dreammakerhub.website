import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { logger } from "@lib/logger";

/**
 * DreamMakerHub AI Provider
 * Uses the platform's own AI capabilities for generation.
 * Routes through the unified AI endpoint.
 */
export const dreammakerhubProvider: AIProvider = {
  name: "dreammakerhub",

  async generate(prompt: string | unknown[], options: AIProviderOptions): Promise<AIResponse> {
    const baseUrl = process.env.DREAMMAKERHUB_API_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    const apiKey = process.env.DREAMMAKERHUB_API_KEY || "";
    const { system, temperature = 0.7 } = options ?? {};

    try {
      const messages = Array.isArray(prompt)
        ? prompt
        : [{ role: "user", content: String(prompt) }];

      const response = await fetch(`${baseUrl}/api/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          messages,
          system,
          temperature,
          provider: "dreammakerhub",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        logger.error("DreamMakerHub AI error", { status: response.status, error: errorText });
        return {
          text: "Generation unavailable.",
          error: true,
          provider: "dreammakerhub",
          model: "dreammakerhub-default",
          confessions: {
            confidence: 0,
            reasoning: ["DreamMakerHub AI endpoint returned an error"],
            limitations: [`HTTP ${response.status}: ${errorText}`],
          },
        };
      }

      const data = await response.json();
      const output = data?.text || data?.response || data?.output || data?.choices?.[0]?.message?.content || "";

      return {
        text: output,
        provider: "dreammakerhub",
        model: data?.model || "dreammakerhub-default",
        confessions: {
          confidence: data?.confidence || 0.85,
          reasoning: ["Generated via DreamMakerHub AI"],
          limitations: [],
        },
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("DreamMakerHub provider error", { error: errMsg });

      return {
        text: "Generation unavailable.",
        error: true,
        provider: "dreammakerhub",
        model: "dreammakerhub-default",
        confessions: {
          confidence: 0,
          reasoning: ["Network or infrastructure failure"],
          limitations: [errMsg],
        },
      };
    }
  },
};
