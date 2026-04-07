/**
 * Google AI Studio Provider (Gemini 2.0 Flash)
 * Uses GEMINI_API_KEY secret.
 */
export const googleProvider = {
  name: "google",
  async generate(prompt: any, options: any) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY environment variable.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const parts: { text: string }[] = [];
    if (options.system) parts.push({ text: `System Instructions: ${options.system}` });
    parts.push({ text: Array.isArray(prompt) ? JSON.stringify(prompt) : String(prompt) });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 8192,
        },
      }),
    });

    const data = await response.json();

    if (data.error) throw new Error(`Gemini API Error: ${data.error.message}`);
    if (!data.candidates?.length) throw new Error("Gemini returned no candidates.");

    return {
      text: data.candidates[0].content.parts[0].text,
      provider: "google",
    };
  },
};
