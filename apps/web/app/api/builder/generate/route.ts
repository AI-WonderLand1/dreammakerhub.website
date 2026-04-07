import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, mode, platform, modelId, image } = await req.json();

    // Default System Instructions
    const systemPrompt = `
      You are the Wonder-Build AI Engine.
      Platform Target: ${platform}
      Mode: ${mode}
      
      Output ONLY valid JSON matching this schema:
      {
        "type": "string",
        "className": "string",
        "style": {},
        "content": "string",
        "children": []
      }
      Use Tailwind CSS for styling. Do not explain the code.
    `;

    // Map user selection to Google AI model strings
    const modelMap: Record<string, string> = {
      'fast': 'gemini-1.5-flash',
      'pro': 'gemini-1.5-pro',
      'creative': 'gemini-1.5-pro',
      'vision': 'gemini-1.5-pro' // Gemini supports vision
    };

    const selectedModel = modelMap[modelId] || modelMap['fast'];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;

    const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];
    parts.push({ text: `${systemPrompt}\n\n${prompt}` });

    // Handle image input if provided
    if (image) {
      // For simplicity, we'll just include the image URL in text for now
      // Google AI API requires base64 encoded images, but this is a complex change
      parts.push({ text: `Image reference: ${image}` });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Google AI API Error: ${data.error.message}`);
    }

    // Parse the AI's content string back into JSON for the Engine
    const aiContent = JSON.parse(data.candidates[0].content.parts[0].text);

    return NextResponse.json(aiContent);
  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "Failed to generate layout" }, { status: 500 });
  }
}

