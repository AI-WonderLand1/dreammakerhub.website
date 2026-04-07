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

    // Map user selection to GROQ model strings
    const modelMap: Record<string, string> = {
      'fast': 'llama-3.1-8b-instant',
      'pro': 'llama3-70b-8192',
      'creative': 'mixtral-8x7b-32768',
      'vision': 'llama3-70b-8192' // GROQ doesn't have native vision, use best model
    };

    const selectedModel = modelMap[modelId] || modelMap['fast'];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
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
      throw new Error(`GROQ API Error: ${data.error.message}`);
    }

    // Parse the AI's content string back into JSON for the Engine
    const aiContent = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(aiContent);
  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "Failed to generate layout" }, { status: 500 });
  }
}

