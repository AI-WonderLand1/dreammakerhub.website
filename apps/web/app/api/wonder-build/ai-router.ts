import { NextResponse } from 'next/server';
import { runModel } from '@core/ai/runModel';
import { buildClassificationPrompt } from '@core/ai/promptBuilder';

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;

const MODE_PROMPTS: Record<string, string> = {
  'image-to-code': 'Analyze this image and generate the corresponding HTML/CSS code. Return only valid JSON with the layout structure.',
  'video-to-code': 'Analyze this video description and generate the corresponding HTML/CSS/JS code. Return only valid JSON with the layout structure.',
  'ai-style': 'Analyze this component and suggest TailwindCSS style improvements. Return only valid JSON with the style suggestions.',
  'code-convert': 'Convert the following code to the target language. Return only valid JSON with the converted code.',
};

async function callCerebras(prompt: string, systemPrompt: string) {
  if (!CEREBRAS_API_KEY) {
    throw new Error('Cerebras API key not configured');
  }

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cerebras API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callHuggingFace(prompt: string, systemPrompt: string) {
  if (!HF_TOKEN) {
    throw new Error('HuggingFace token not configured');
  }

  const response = await fetch('https://api-inference.huggingface.co/models/microsoft/Phi-4-mini-instruct', {
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
    throw new Error(`HF API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data[0]?.generated_text : data.generated_text || '';
}

export async function runAI(mode: string, prompt: string): Promise<any> {
  const systemPrompt = MODE_PROMPTS[mode] || 'Respond with valid JSON.';

  let content = '';

  if (CEREBRAS_API_KEY) {
    try {
      content = await callCerebras(prompt, systemPrompt);
    } catch (error: any) {
      console.error('Cerebras failed, falling back to HuggingFace:', error.message);
    }
  }

  if (!content && HF_TOKEN) {
    try {
      content = await callHuggingFace(prompt, systemPrompt);
    } catch (error: any) {
      return { error: error.message || 'All AI providers failed', success: false };
    }
  }

  if (!content) {
<<<<<<< HEAD
=======
    // Fallback to Groq
    try {
      const result = await runModel({
        model: 'groq/llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: `${systemPrompt}\n\n${prompt}` }
        ],
      });
      content = result.text || '';
    } catch (error: any) {
      return { error: error.message || 'All AI providers failed', success: false };
    }
  }

  if (!content) {
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
    return { error: 'No AI provider configured', success: false };
  }

  try {
    return { ...JSON.parse(content), success: true };
  } catch {
    return { text: content, success: true };
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
<<<<<<< HEAD
    const result = await runModel({ model: 'github/gpt-4o-mini', messages: [{ role: 'user', content: classificationPrompt }] });
=======
    const result = await runModel({ model: 'groq/llama-3.1-8b-instant', messages: [{ role: 'user', content: classificationPrompt }] });
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
    
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