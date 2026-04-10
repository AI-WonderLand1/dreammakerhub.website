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

    // Map user selection to GitHub Models
    const modelMap: Record<string, string> = {
      'fast': 'gpt-4o-mini',
      'pro': 'gpt-4o',
      'creative': 'gpt-4o',
      'vision': 'gpt-4o' // GitHub Models doesn't have native vision, use best model
    };

    const selectedModel = modelMap[modelId] || modelMap['fast'];

    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GITHUB_MODELS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${prompt}${image ? `\n\nImage reference: ${image}` : ''}` }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`GitHub Models API Error: ${data.error.message}`);
    }

    // Parse the AI's content string back into JSON for the Engine
    const aiContent = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(aiContent);
  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "Failed to generate layout" }, { status: 500 });
  }
}

