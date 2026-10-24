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
    return {
      url: '/api/chat',
      body: { modelId: input.modelId, message: input.message,
        history: input.history, context: { page: input.page } },
    };
  }
  return {
    url: '/api/unified-ai',
    body: { action: 'agent', agent: input.agent, message: input.message,
      context: { page: input.page }, history: input.history },
  };
}
