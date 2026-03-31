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

    // Map user selection to OpenRouter model strings
    const modelMap: Record<string, string> = {
      'fast': 'google/gemini-2.0-flash-001',
      'pro': 'anthropic/claude-3.5-sonnet',
      'creative': 'openai/gpt-4o',
      'vision': 'google/gemini-2.0-pro-exp-02-05:free' // Great for Image-to-Code
    };

    const selectedModel = modelMap[modelId] || modelMap['fast'];

    const messages = [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: image 
          ? [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } }
            ]
          : prompt 
      }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://wonderbuild.ai", // Required by OpenRouter
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    
    // Parse the AI's content string back into JSON for the Engine
    const aiContent = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(aiContent);
  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "Failed to generate layout" }, { status: 500 });
  }
}

