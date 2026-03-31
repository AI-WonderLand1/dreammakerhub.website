import { NextResponse } from 'next/server';
import { runModel } from '@/engine/core/ai/runModel';
import { buildClassificationPrompt } from '@/engine/core/ai/promptBuilder';

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