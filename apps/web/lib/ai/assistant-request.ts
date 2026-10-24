type ConversationMessage = { role: 'user' | 'assistant'; content: string };

/** Never silently substitute deterministic support answers for AI completions. */
export function buildAssistantRequest(input: {
  agent: string;
  message: string;
  modelId: string;
  page: string;
  history: ConversationMessage[];
}) {
  if (input.agent === 'guided-support') {
    return { url: '/api/support/help', body: { message: input.message.slice(0, 1200) } };
  }
  if (input.agent === 'spirit-guide') {
    // /api/chat caps message + history at 12,000 characters. Retain the
    // newest contiguous turns that fit so long conversations can keep going.
    let remainingCharacters = Math.max(0, 12_000 - input.message.length);
    const recentHistory: ConversationMessage[] = [];
    for (let index = input.history.length - 1; index >= 0; index -= 1) {
      const entry = input.history[index];
      if (entry.content.length > remainingCharacters) break;
      recentHistory.unshift(entry);
      remainingCharacters -= entry.content.length;
    }
    return {
      url: '/api/chat',
      body: { modelId: input.modelId, message: input.message,
        history: recentHistory, context: { page: input.page } },
    };
  }
  return {
    url: '/api/unified-ai',
    body: { action: 'agent', agent: input.agent, message: input.message,
      context: { page: input.page }, history: input.history },
  };
}
