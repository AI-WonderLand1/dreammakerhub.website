import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { logger } from "@lib/logger";

export const n8nProvider: AIProvider = {
  name: "n8n",

  async generate(prompt: string | unknown[], options: AIProviderOptions): Promise<AIResponse> {
    const webhookUrl = process.env.N8N_WEBHOOK_URL || "https://aiwonderland.app.n8n.cloud/webhook/user-choice";
    const apiKey = process.env.N8N_API_KEY || "";
    const { system, temperature = 0.7 } = options ?? {};

    try {
      const choice = Array.isArray(prompt) ? JSON.stringify(prompt) : String(prompt);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ choice }),
      });

      if (!response.ok) {
        logger.error("n8n webhook error", { status: response.status });
        return {
          text: "Classification unavailable.",
          error: true,
          provider: "n8n",
          model: "user-choice",
          confessions: {
            confidence: 0,
            reasoning: ["n8n webhook returned an error"],
            limitations: [`HTTP ${response.status}`]
          }
        };
      }

      const data = await response.json();
      const output = data?.output || "";

      return {
        text: output,
        provider: "n8n",
        model: "user-choice",
        confessions: {
          confidence: 0.9,
          reasoning: ["Classified via n8n workflow"],
          limitations: ["Returns 3D / AGENT / SAAS only"]
        }
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown n8n error";
      logger.error("n8n provider error", { error: errMsg });

      return {
        text: "Classification unavailable.",
        error: true,
        provider: "n8n",
        model: "user-choice",
        confessions: {
          confidence: 0,
          reasoning: ["Network or infrastructure failure"],
          limitations: [errMsg]
        }
      };
    }
  },
};
