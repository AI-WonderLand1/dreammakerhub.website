export const callOpenRouter = async (config: PlaygroundConfig, prompt: string, onDelta: (chunk: string) => void) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY}`;

  const parts: { text: string }[] = [];
  if (config.systemInstruction) parts.push({ text: `System Instructions: ${config.systemInstruction}` });
  parts.push({ text: prompt });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: config.temperature,
        topP: config.topP,
        maxOutputTokens: 4096,
      },
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`Google AI API Error: ${data.error.message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  // Since Google AI doesn't stream, we'll simulate streaming by sending the text in chunks
  const words = text.split(' ');
  for (const word of words) {
    onDelta(word + ' ');
    // Small delay to simulate streaming
    await new Promise(resolve => setTimeout(resolve, 50));
  }
};