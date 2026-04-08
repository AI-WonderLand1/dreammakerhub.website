import { NextResponse } from 'next/server';
import { runModel } from '@/engine/core/ai/runModel';
import { buildClassificationPrompt } from '@/engine/core/ai/promptBuilder';

const HF_TOKEN = process.env.Wonder_Build_2026;

const MODE_PROMPTS: Record<string, string> = {
  'image-to-code': 'Analyze this image and generate the corresponding HTML/CSS code. Return only valid JSON with the layout structure.',
  'video-to-code': 'Analyze this video description and generate the corresponding HTML/CSS/JS code. Return only valid JSON with the layout structure.',
  'ai-style': 'Analyze this component and suggest TailwindCSS style improvements. Return only valid JSON with the style suggestions.',
  'code-convert': 'Convert the following code to the target language. Return only valid JSON with the converted code.',
};

export async function runAI(mode: string, prompt: string): Promise<any> {
  if (!HF_TOKEN) {
    return { error: 'HuggingFace token not configured', success: false };
  }

  const modelMap: Record<string, string> = {
    'image-to-code': 'microsoft/Phi-4-mini-instruct',
    'video-to-code': 'microsoft/Phi-4-mini-instruct',
    'ai-style': 'microsoft/Phi-4-mini-instruct',
    'code-convert': 'microsoft/Phi-4-mini-instruct',
  };

  const model = modelMap[mode] || 'microsoft/Phi-4-mini-instruct';
  const systemPrompt = MODE_PROMPTS[mode] || 'Respond with valid JSON.';

  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_TOKEN}`,
      },
      body: JSON.stringify({
        inputs: `${systemPrompt}\n\nUser: ${prompt}`,
        parameters: {
          max_new_tokens: 4096,
          return_full_text: false,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `HF API error: ${response.status}`, details: errorText, success: false };
    }

    const data = await response.json();
    const content = Array.isArray(data) ? data[0]?.generated_text : data.generated_text || '';

    try {
      return { ...JSON.parse(content), success: true };
    } catch {
      return { text: content, success: true };
    }
  } catch (error: any) {
    return { error: error.message || 'Unknown error', success: false };
  }
}

/**
 * Rick: Look, I'm routing the user's incoherent rambling to the actual tools. 
 * It's not rocket science, except I'm the one who built it, so it basically is.
 */
export async function POST(req: Request) {
  const { prompt, mode } = await req.json();

  if (mode === 'classify') {
    const classificationPrompt = buildClassificationPrompt(prompt);
    const result = await runModel({ prompt: classificationPrompt });
    
    // Rick: We're parsing the AI's garbage output. Better be JSON or I'm out.
    try {
      const parsed = JSON.parse(result.text);
      return NextResponse.json(parsed);
    } catch (e) {
      return NextResponse.json({ builderType: 'web' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
}