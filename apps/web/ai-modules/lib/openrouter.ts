export const callOpenRouter = async (config: PlaygroundConfig, prompt: string, onDelta: (chunk: string) => void) => {
  const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GITHUB_MODELS_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        ...(config.systemInstruction ? [{ role: "system", content: config.systemInstruction }] : []),
        { role: "user", content: prompt }
      ],
      temperature: config.temperature,
      top_p: config.topP,
      max_tokens: 4096,
      stream: true,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub Models API Error: ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onDelta(content);
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};