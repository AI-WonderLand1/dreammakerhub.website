import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { openrouterProvider } from "./openrouter";

/**
 * GROQ AI Provider
 * Uses GROQ API for fast inference with various models.
 * Supports user-provided apiKey via options.
 */
export const groqProvider: AIProvider = {
  name: "groq",

  async generate(prompt: string | unknown[], options: AIProviderOptions): Promise<AIResponse> {
    const apiKey = options.apiKey as string || process.env.GROQ_API_KEY || '';
    const {
      model = "llama-3.1-8b-instant",
      system,
      temperature = 0.7,
      maxTokens = 4096
    } = options ?? {};

    if (!apiKey) {
      const fallback = await openrouterProvider.generate(prompt, options);
      return {
        text: fallback.text || "Falling back to OpenRouter",
        ...fallback,
        provider: "groq",
        confessions: {
          ...fallback.confessions,
          reasoning: ["Fallback to OpenRouter due to missing API key"]
        }
      };
    }

    try {
      const messages: Array<{ role: string; content: string | unknown[]}> = [];
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
        const errorMessage = data.error.message || "Unknown error";
        return {
          text: "The Spirit Guide encountered an error with GROQ API.",
          error: true,
          provider: "groq",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["GROQ API returned an error", errorMessage],
            limitations: ["Check GROQ_API_KEY configuration"]
          }
        };
      }

      if (!data.choices?.length) {
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
          limitations: ["May have usage limits"],
        }
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown network error";
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