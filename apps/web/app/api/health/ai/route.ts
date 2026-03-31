import { createClient } from '../../../utils/supabase/server';
import { env, requireEnv } from '@lib/env';

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const aiResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${requireEnv(env.OPENAI_API_KEY, "OPENAI_API_KEY")}`,
      }
    });

    return Response.json({ 
      status: aiResponse.ok ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      message: aiResponse.ok ? 'AI services available' : 'AI services experiencing issues',
      details: {
        openai: aiResponse.ok,
        providers: ['openai', 'anthropic', 'google']
      }
    });
  } catch (error) {
    return Response.json({ 
      status: 'major_outage',
      timestamp: new Date().toISOString(),
      message: 'AI services unavailable',
      error: error.message
    }, { status: 503 });
  }
}
