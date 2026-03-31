import { PlaygroundMessage, PlaygroundSession } from "@/types/playground";

// In-memory session storage (replace with Supabase later)
const sessions = new Map<string, PlaygroundSession>();

export async function getOrCreateSession(sessionId?: string): Promise<PlaygroundSession> {
  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId)!;
  }

  const newSession: PlaygroundSession = {
    id: sessionId || crypto.randomUUID(),
    name: `Session ${new Date().toLocaleString()}`,
    messages: [],
    model: "claude-sonnet-4",
    systemPrompt: "",
    parameters: {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 1.0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  sessions.set(newSession.id, newSession);
  return newSession;
}

export async function appendMessageToSession(
  sessionId: string,
  message: PlaygroundMessage
): Promise<void> {
  const session = await getOrCreateSession(sessionId);
  session.messages.push(message);
  session.updatedAt = new Date();
}

export async function clearSession(sessionId: string): Promise<void> {
  sessions.delete(sessionId);
}
