import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { logger } from "@lib/logger";

/**
<<<<<<< HEAD
 * Google AI Provider (Gemini)
 * Uses Google AI API directly for Gemini models.
 *
 * NOTE: File named openrouter.ts but implements Google AI.
 * TODO: Re-add actual OpenRouter provider routing to openrouter.ai
=======
 * OpenRouter Provider
 * Routes requests to many models via openrouter.ai
 * Uses OPENROUTER_API_KEY secret or user-provided apiKey.
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
 */
export const googleProvider: AIProvider = {
  name: "google",

  async generate(prompt: string | unknown[], options: AIProviderOptions): Promise<AIResponse> {
<<<<<<< HEAD
    const apiKey = requireEnv(env.GOOGLE_AI_API_KEY, "GOOGLE_AI_API_KEY");
    const {
      model = "gemini-2.5-flash",
=======
    const apiKey = options.apiKey as string || process.env.OPENROUTER_API_KEY || '';
    const {
      model = "google/gemini-flash-1.5",
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
      system,
      temperature = 0.7,
      maxTokens = 4096
    } = options ?? {};

<<<<<<< HEAD
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
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown network error";
      logger.error("✦ Spirit Guide Connection Severed (Google AI)", {
        error: errMsg
      });

      return {
        text: "The Spirit Guide lost connection to Google AI API.",
=======
    if (!apiKey) {
      return {
        text: "OPENROUTER_API_KEY not configured. Add it in Settings → AI Providers.",
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
        error: true,
        provider: "openrouter",
        model,
        confessions: {
          confidence: 0,
<<<<<<< HEAD
          reasoning: ["Network or infrastructure failure"],
          limitations: [errMsg]
=======
          reasoning: ["OPENROUTER_API_KEY missing"],
          limitations: ["Set OPENROUTER_API_KEY in Settings → AI Providers"]
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
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
          "HTTP-Referer": process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : "https://aiwonderland.replit.app",
          "X-Title": "AI Wonderland",
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
        logger.error("❌ OpenRouter API Error", { error: data.error });
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
      logger.error("✦ OpenRouter connection error", { error: errMsg });
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
<<<<<<< HEAD

export const openrouterProvider = googleProvider;

=======
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
