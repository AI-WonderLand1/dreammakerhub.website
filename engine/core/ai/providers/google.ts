import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { logger } from "@lib/logger";

/**
 * Google AI Studio Provider (Gemini 2.0 Flash)
 * Uses GEMINI_API_KEY or user-provided apiKey via options.
 */
export const googleProvider: AIProvider = {
  name: "google",
<<<<<<< HEAD
  async generate(prompt: string | unknown[], options: Record<string, unknown>) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY environment variable.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
=======

  async generate(prompt: string | unknown[], options: AIProviderOptions): Promise<AIResponse> {
    const apiKey = options.apiKey as string || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
    const {
      model = "gemini-2.5-flash",
      system,
      temperature = 0.7,
      maxTokens = 8192
    } = options ?? {};
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

    if (!apiKey) {
      return {
        text: "GEMINI_API_KEY not configured. Add it in Settings → AI Providers.",
        error: true,
        provider: "google",
        model,
        confessions: {
          confidence: 0,
          reasoning: ["GEMINI_API_KEY missing"],
          limitations: ["Set GEMINI_API_KEY in Settings → AI Providers"]
        }
      };
    }

<<<<<<< HEAD
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 8192,
        },
      }),
    });
=======
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

      const parts: { text: string }[] = [];
      if (system) parts.push({ text: `System Instructions: ${system}` });
      parts.push({ text: Array.isArray(prompt) ? JSON.stringify(prompt) : String(prompt) });

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
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
          text: "The Spirit Guide encountered an error with Google AI.",
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
        logger.error("❌ Google AI returned no candidates", { data });
        return {
          text: "The Spirit Guide received no response from Google AI.",
          error: true,
          provider: "google",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["No candidates returned from Google AI"],
            limitations: ["Empty response"]
          }
        };
      }

      return {
        text: data.candidates[0].content.parts[0].text,
        provider: "google",
        model,
        confessions: {
          confidence: 0.95,
          reasoning: ["Processed via Google AI"],
          limitations: ["May have usage limits"]
        }
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown network error";
      logger.error("✦ Spirit Guide Connection Severed (Google AI)", { error: errMsg });
      return {
        text: "The Spirit Guide lost connection to Google AI.",
        error: true,
        provider: "google",
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
