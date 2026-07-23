import "server-only";
import type { AIProvider, AIProviderOptions, AIResponse } from "../types";
import { logger } from "@lib/logger";
import { isInternalUrl } from "./ssrf";

export const webhookProvider: AIProvider = {
  name: "webhook",

  async generate(prompt: string | unknown[], options: AIProviderOptions): Promise<AIResponse> {
    const webhookUrl = options.baseUrl as string || options.webhookUrl as string || '';
    const apiKey = options.apiKey as string || '';
    const apiKeyHeader = (options.apiKeyHeader as string) || 'x-api-key';
    const { model = "webhook", system, temperature = 0.7 } = options ?? {};

    if (!webhookUrl) {
      return {
        text: "Webhook URL not configured. Add it in Settings → AI Providers.",
        error: true,
        provider: "webhook",
        model,
        confessions: {
          confidence: 0,
          reasoning: ["Webhook URL missing"],
          limitations: ["Set a webhook URL in Settings → AI Providers"]
        }
      };
    }

    if (isInternalUrl(webhookUrl)) {
      return {
        text: "Webhook URL points to an internal or restricted network — not allowed.",
        error: true,
        provider: "webhook",
        model,
        confessions: {
          confidence: 0,
          reasoning: ["SSRF blocked: internal URL detected"],
          limitations: ["Internal/private network URLs are not allowed"]
        }
      };
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (apiKey) {
        headers[apiKeyHeader] = apiKey;
      }

      const body: Record<string, unknown> = {
        prompt: Array.isArray(prompt) ? JSON.stringify(prompt) : String(prompt),
        model,
      };

      if (system) {
        body.system = system;
      }

      if (temperature !== undefined) {
        body.temperature = temperature;
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        logger.error("Webhook provider error", { status: response.status });
        return {
          text: "Webhook returned an error.",
          error: true,
          provider: "webhook",
          model,
          confessions: {
            confidence: 0,
            reasoning: ["Webhook returned an error"],
            limitations: [`HTTP ${response.status}`]
          }
        };
      }

      const data = await response.json();
      const outputText = typeof data === 'string' ? data : (data.text || data.output || data.response || data.message || JSON.stringify(data));

      return {
        text: outputText,
        provider: "webhook",
        model,
        confessions: {
          confidence: 0.9,
          reasoning: ["Processed via webhook"],
          limitations: ["Depends on the configured webhook endpoint"]
        }
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown webhook error";
      logger.error("Webhook provider error", { error: errMsg });

      return {
        text: "Webhook unavailable.",
        error: true,
        provider: "webhook",
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
