import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { env, requireEnv } from "@lib/env";
import { logger } from "@lib/logger";

/**
 * Google AI Provider (Gemini)
 * Uses Google AI API directly for Gemini models.
 */
export const openrouterProvider: AIProvider = {
  name: "google",

  async generate(prompt: string | any[], options: AIProviderOptions): Promise<AIResponse> {
    const apiKey = requireEnv(env.GOOGLE_AI_API_KEY, "GOOGLE_AI_API_KEY");
    const {
      model = "gemini-1.5-flash",
      system,
      temperature = 0.7,
      maxTokens = 4096
    } = options ?? {};

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const parts: { text: string }[] = [];
      if (system) parts.push({ text: `System Instructions: ${system}` });
      parts.push({ text: Array.isArray(prompt) ? JSON.stringify(prompt) : String(prompt) });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        logger.error("❌ Google AI API Error", { error: data.error });
        return {
          text: "The Spirit Guide encountered an error with Google AI API.",
          error: true,
          provider: "google",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["Google AI API returned an error"],
            limitations: [data.error.message || "Unknown error"]
          }
        };
      }

      if (!data.candidates?.length) {
        logger.error("❌ Google AI API returned no candidates", { data });
        return {
          text: "The Spirit Guide received no response from Google AI API.",
          error: true,
          provider: "google",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["No candidates returned from Google AI API"],
            limitations: ["Empty response"]
          }
        };
      }

      const outputText = data.candidates[0].content.parts[0].text;

      return {
        text: outputText,
        provider: "google",
        model,
        confessions: {
          confidence: 0.95,
          reasoning: ["Processed via Google AI API"],
          limitations: ["May have usage limits"]
        }
      };
    } catch (error: any) {
      logger.error("✦ Spirit Guide Connection Severed (Google AI)", {
        error: error?.message ?? error
      });

      return {
        text: "The Spirit Guide lost connection to Google AI API.",
        error: true,
        provider: "google",
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

