import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { env, requireEnv } from "@lib/env";
import { logger } from "@lib/logger";

/**
 * OpenRouter Provider
 * Upgraded to support Vision (Images) and Video-to-Code pipelines.
 */
export const openrouterProvider: AIProvider = {
  name: "openrouter",

  async generate(prompt: string | any[], options: AIProviderOptions): Promise<AIResponse> {
    const apiKey = requireEnv(env.OPENROUTER_API_KEY, "OPENROUTER_API_KEY");
    const { 
      model = "google/gemini-2.0-flash-001", // Default to high-speed multimodal
      system, 
      temperature = 0.7, 
      maxTokens = 4096 
    } = options ?? {};

    try {
      // 1. Prepare Content: Support both simple strings and complex multimodal arrays
      // This allows sending images/video frames directly to models like Gemini 2.0
      const userContent = Array.isArray(prompt) ? prompt : [{ type: "text", text: prompt }];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://wonder-build.ai", // Required for OpenRouter rankings
          "X-Title": "Wonder-Build Engine",
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(system ? [{ role: "system", content: system }] : []),
            { role: "user", content: userContent },
          ],
          temperature,
          max_tokens: maxTokens,
          // Ensures we get structured JSON back for the LayoutTree
          response_format: { type: "json_object" } 
        }),
      });

      const raw = await response.text();

      if (!response.ok) {
        logger.error("❌ OpenRouter Stream Turbulence", { status: response.status, raw });
        return {
          text: "The Spirit Guide encountered turbulence in the OpenRouter stream.",
          error: true,
          provider: "openrouter",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["Provider returned a non-OK response"],
            limitations: [raw || "Unknown error"]
          }
        };
      }

      const data = JSON.parse(raw);
      const outputText = data.choices?.[0]?.message?.content ?? "";

      return {
        text: outputText,
        provider: "openrouter",
        model,
        confessions: {
          confidence: 0.95,
          reasoning: ["Processed via OpenRouter unified gateway"],
          limitations: ["Latency may vary based on provider routing"]
        }
      };
    } catch (error: any) {
      logger.error("✦ Spirit Guide Connection Severed (OpenRouter)", {
        error: error?.message ?? error
      });

      return {
        text: "The Spirit Guide lost connection to the OpenRouter gateway.",
        error: true,
        provider: "openrouter",
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

