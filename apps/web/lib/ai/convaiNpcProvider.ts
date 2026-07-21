import { AiNpcProvider, type NpcResponse, NpcProviderError, type NpcSession } from "@/lib/aiNpcProvider";
import { logger } from '@/lib/logger';

type ProviderEnv = {
  NEXT_PUBLIC_ENABLE_CONVAI_NPC?: string;
  NEXT_PUBLIC_CONVAI_CHARACTER_ID?: string;
};

type Subscriber = (response: NpcResponse) => void;

/**
 * Convai NPC Provider - Client-side implementation.
 * 
 * SECURITY NOTE: This provider does NOT store API keys on the client.
 * All API calls are proxied through the server-side /api/convai/chat endpoint.
 */
export class ConvaiNpcProvider implements AiNpcProvider {
  readonly name = "convai";
  readonly isConfigured: boolean;

  private readonly enabled: boolean;
  private readonly characterId?: string;
  private readonly subscribers = new Map<string, Set<Subscriber>>();

  constructor(env: ProviderEnv = process.env) {
    this.enabled = env.NEXT_PUBLIC_ENABLE_CONVAI_NPC === "true";
    this.characterId = env.NEXT_PUBLIC_CONVAI_CHARACTER_ID;
    // Only check for feature flag and character ID on client
    // API key is stored server-side only
    this.isConfigured = Boolean(this.enabled && this.characterId);
  }

  async createSession(): Promise<NpcSession> {
    this.assertConfigured();

    const sessionId = `${this.characterId}-${Date.now().toString(36)}`;
    return { sessionId };
  }

  async sendUserUtterance(sessionId: string, utterance: string): Promise<void> {
    this.assertConfigured();

    const trimmed = utterance.trim();
    if (!trimmed) {
      throw new NpcProviderError("Utterance cannot be empty.");
    }

    const listeners = this.subscribers.get(sessionId);
    if (!listeners || listeners.size === 0) {
      return;
    }

    try {
      // Call server-side proxy instead of Convai directly
      const response = await fetch("/api/convai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          utterance: trimmed,
          characterId: this.characterId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new NpcProviderError(error.error || `Convai API error: ${response.status}`);
      }

      const data = await response.json();
      
      const npcResponse: NpcResponse = {
        id: `${sessionId}-${Date.now().toString(36)}`,
        text: data.text || data.response || "No response from Convai",
      };

      listeners.forEach((listener) => listener(npcResponse));
    } catch (error) {
      logger.error("Error calling Convai:", error);
      
      // Fallback to placeholder for development
      const fallbackResponse: NpcResponse = {
        id: `${sessionId}-${Date.now().toString(36)}`,
        text: `[Fallback] Convai response: ${trimmed}`,
      };
      
      listeners.forEach((listener) => listener(fallbackResponse));
    }
  }

  subscribeNpcResponses(sessionId: string, onResponse: Subscriber): () => void {
    const listeners = this.subscribers.get(sessionId) ?? new Set<Subscriber>();
    listeners.add(onResponse);
    this.subscribers.set(sessionId, listeners);

    return () => {
      const activeListeners = this.subscribers.get(sessionId);
      if (!activeListeners) {
        return;
      }

      activeListeners.delete(onResponse);
      if (activeListeners.size === 0) {
        this.subscribers.delete(sessionId);
      }
    };
  }

  private assertConfigured() {
    if (!this.enabled) {
      throw new NpcProviderError("Convai NPC provider is disabled by feature flag.");
    }

    if (!this.characterId) {
      throw new NpcProviderError("Convai NPC provider is missing required character ID. Set NEXT_PUBLIC_CONVAI_CHARACTER_ID.");
    }
  }
}

export function createNpcProviderFromEnv(env?: ProviderEnv): AiNpcProvider {
  return new ConvaiNpcProvider(env);
}
