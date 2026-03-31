export type NpcSession = {
  sessionId: string;
};

export type NpcResponse = {
  id: string;
  text: string;
};

export type NpcResponseHandler = (response: NpcResponse) => void;

export interface AiNpcProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  createSession(): Promise<NpcSession>;
  sendUserUtterance(sessionId: string, utterance: string): Promise<void>;
  subscribeNpcResponses(sessionId: string, onResponse: NpcResponseHandler): () => void;
}

export class NpcProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NpcProviderError";
  }
}
