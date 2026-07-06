import { NextResponse } from 'next/server';
import { runModel } from "@/core/ai/runModel";

export async function POST(req: Request) {
  try {
    const { prompt, mode, platform, modelId, image } = await req.json();

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

    const result = await runModel({
      model: "openrouter/meta-llama/llama-3.3-70b-instruct",
      messages: [{ role: "user", content: `${prompt}${image ? `\n\nImage reference: ${image}` : ''}` }],
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 4096,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    const aiContent = JSON.parse(result.text);

    return NextResponse.json(aiContent);
  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "Failed to generate layout" }, { status: 500 });
  }
}

