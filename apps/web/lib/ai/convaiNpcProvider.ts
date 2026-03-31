import { AiNpcProvider, type NpcResponse, NpcProviderError, type NpcSession } from "@/lib/aiNpcProvider";

type ProviderEnv = {
  NEXT_PUBLIC_ENABLE_CONVAI_NPC?: string;
  NEXT_PUBLIC_CONVAI_API_KEY?: string;
  NEXT_PUBLIC_CONVAI_CHARACTER_ID?: string;
};

type Subscriber = (response: NpcResponse) => void;

export class ConvaiNpcProvider implements AiNpcProvider {
  readonly name = "convai";
  readonly isConfigured: boolean;

  private readonly enabled: boolean;
  private readonly apiKey?: string;
  private readonly characterId?: string;
  private readonly subscribers = new Map<string, Set<Subscriber>>();

  constructor(env: ProviderEnv = process.env) {
    this.enabled = env.NEXT_PUBLIC_ENABLE_CONVAI_NPC === "true";
    this.apiKey = env.NEXT_PUBLIC_CONVAI_API_KEY;
    this.characterId = env.NEXT_PUBLIC_CONVAI_CHARACTER_ID;
    this.isConfigured = Boolean(this.enabled && this.apiKey && this.characterId);
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

    const response: NpcResponse = {
      id: `${sessionId}-${Date.now().toString(36)}`,
      text: `Convai placeholder response: ${trimmed}`,
    };

    listeners.forEach((listener) => listener(response));
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

    if (!this.apiKey || !this.characterId) {
      throw new NpcProviderError("Convai NPC provider is missing required environment keys.");
    }
  }
}

export function createNpcProviderFromEnv(env?: ProviderEnv): AiNpcProvider {
  return new ConvaiNpcProvider(env);
}
