export const callOpenRouter = async (config: PlaygroundConfig, prompt: string, onDelta: (chunk: string) => void) => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
      "X-Title": "Wonder.Lab Sovereign_OS",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      stream: true, // Crucial for your ResponseView streaming cursor
      messages: [
        { role: "system", content: config.systemInstruction },
        { role: "user", content: prompt }
      ],
      temperature: config.temperature,
      top_p: config.topP,
      top_k: config.topK,
    })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
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
};