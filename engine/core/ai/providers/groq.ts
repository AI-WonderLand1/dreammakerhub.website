import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { logger } from "@lib/logger";

/**
 * GROQ AI Provider
 * Uses GROQ API for fast inference with various models.
 */
export const groqProvider: AIProvider = {
  name: "groq",

  async generate(prompt: string | unknown[], options: AIProviderOptions): Promise<AIResponse> {
    const apiKey = process.env.GROQ_API_KEY || '';
    const {
      model = "llama-3.1-8b-instant",
      system,
      temperature = 0.7,
      maxTokens = 4096
    } = options ?? {};

    if (!apiKey) {
      return {
        text: "GROQ_API_KEY not configured. Add it to Railway.",
        error: true,
        provider: "groq",
        model,
        confessions: {
          confidence: 0,
          reasoning: ["GROQ_API_KEY missing"],
          limitations: ["Set GROQ_API_KEY in Railway environment"]
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

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
        logger.error("❌ GROQ API Error", { error: data.error });
        return {
          text: "The Spirit Guide encountered an error with GROQ API.",
          error: true,
          provider: "groq",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["GROQ API returned an error"],
            limitations: [data.error.message || "Unknown error"]
          }
        };
      }

      if (!data.choices?.length) {
        logger.error("❌ GROQ API returned no choices", { data });
        return {
          text: "The Spirit Guide received no response from GROQ API.",
          error: true,
          provider: "groq",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["No choices returned from GROQ API"],
            limitations: ["Empty response"]
          }
        };
      }

      const outputText = data.choices[0].message.content;

      return {
        text: outputText,
        provider: "groq",
        model,
        confessions: {
          confidence: 0.95,
          reasoning: ["Processed via GROQ API"],
          limitations: ["May have usage limits"]
        }
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown network error";
      logger.error("✦ Spirit Guide Connection Severed (GROQ)", {
        error: errMsg
      });

      return {
        text: "The Spirit Guide lost connection to GROQ API.",
        error: true,
        provider: "groq",
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