interface OpenRouterConfig {
  model: string;
  systemInstruction: string;
  temperature?: number;
  topP?: number;
  topK?: number;
}

/**
 * Calls OpenRouter API through a server-side proxy.
 * This keeps the API key secure on the server.
 * 
 * SECURITY: Do NOT call OpenRouter directly from the client with an API key.
 * Always route through a server-side API endpoint.
 */
export const callOpenRouter = async (
  config: OpenRouterConfig, 
  prompt: string, 
  onDelta: (chunk: string) => void
): Promise<void> => {
  // Call our server-side proxy instead of OpenRouter directly
  const response = await fetch("/api/openrouter/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      stream: true,
      messages: [
        { role: "system", content: config.systemInstruction },
        { role: "user", content: prompt }
      ],
      temperature: config.temperature,
      top_p: config.topP,
      top_k: config.topK,
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.includes('[DONE]')) return;
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices[0]?.delta?.content;
            if (content) onDelta(content);
          } catch (e) {
            console.error("Error parsing OpenRouter stream", e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};