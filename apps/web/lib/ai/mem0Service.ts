import { logger } from '@/lib/logger';
function mem0ApiKey(): string {
  return (process.env.MEM0AI_API_KEY || process.env.MEM0_API_KEY || "").trim();
}

export function isMem0ServiceEnabled(): boolean {
  return Boolean(mem0ApiKey());
}

let mem0Client: any = null;

async function getClient() {
  if (!mem0Client) {
    const apiKey = mem0ApiKey();
    if (!apiKey) throw new Error("MEM0AI_API_KEY or MEM0_API_KEY not set");
    const { MemoryClient } = await import("mem0ai");
    mem0Client = new MemoryClient({ apiKey });
  }
  return mem0Client;
}

export async function storeMemory(
  messages: { role: string; content: string }[],
  userId: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    const client = await getClient();
    await client.add(messages, { user_id: userId, metadata });
    return true;
  } catch (error) {
    logger.error("[Mem0AI] storeMemory failed:", error);
    return false;
  }
}

export async function searchMemories(
  query: string,
  userId: string,
  limit: number = 5
): Promise<{ id?: string; text: string; score?: number }[]> {
  try {
    const client = await getClient();
    const results = await client.search(query, {
      filters: { user_id: userId },
      limit,
    });
    return (results as any[]).map((r: any) => ({
      id: r.id,
      text: r.text || r.content || "",
      score: r.score,
    }));
  } catch (error) {
    logger.error("[Mem0AI] searchMemories failed:", error);
    return [];
  }
}

export async function deleteUserMemories(userId: string): Promise<boolean> {
  try {
    const client = await getClient();
    await client.deleteAll({ user_id: userId });
    return true;
  } catch (error) {
    logger.error("[Mem0AI] deleteUserMemories failed:", error);
    return false;
  }
}
