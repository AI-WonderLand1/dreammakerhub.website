import { createClient } from '../../../utils/supabase/server';

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    return Response.json({ 
      status: 'operational',
      timestamp: new Date().toISOString(),
      message: 'Authentication services healthy',
      details: {
        user_count: user ? 1 : 0,
        auth_provider: 'supabase'
      }
    });
  } catch (error) {
    return Response.json({ 
      status: 'degraded',
      timestamp: new Date().toISOString(),
      message: 'Authentication issues detected',
      error: error.message
    }, { status: 503 });
  }
}
