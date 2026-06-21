import { requireEnv } from '@lib/env';

export const runtime = "nodejs";

export async function GET() {
  try {
    // Test Groq (primary AI provider)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${requireEnv('GROQ_API_KEY')}`, 
      }
    });
    
    // Test OpenRouter (fallback provider)
    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${requireEnv('OPENROUTER_API_KEY')}`, 
      }
    });
    
    // Test Google Gemini (another provider)
    const googleResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: {
        'x-goog-api-key': requireEnv('GOOGLE_API_KEY'),
      }
    });

    const isGroqOperational = groqResponse.ok;
    const isOpenrouterOperational = openrouterResponse.ok;
    const isGoogleOperational = googleResponse.ok;

    const hasWorkingProviders = isGroqOperational || isOpenrouterOperational || isGoogleOperational;

    return Response.json({
      status: hasWorkingProviders ? 'operational' : 'major_outage',
      timestamp: new Date().toISOString(),
      message: hasWorkingProviders ? 'AI services available' : 'AI services experiencing issues',
      details: {
        groq: isGroqOperational,
        openrouter: isOpenrouterOperational,
        google: isGoogleOperational,
        workingProviders: hasWorkingProviders ? 
          (isGroqOperational ? 'groq' : '') + 
          (isOpenrouterOperational ? ' openrouter' : '') + 
          (isGoogleOperational ? ' google' : '') : 'none'
      }
    });
  } catch (error) {
    return Response.json({
      status: 'major_outage',
      timestamp: new Date().toISOString(),
      message: 'AI services unavailable',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 503 });
  }
}
