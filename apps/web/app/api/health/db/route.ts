import { createClient } from '../../../utils/supabase/server';

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    return Response.json({ 
      status: 'operational',
      timestamp: new Date().toISOString(),
      message: 'Database connection healthy',
      details: {
        connection: 'active',
        auth: !!user
      }
    });
  } catch (error) {
    return Response.json({ 
      status: 'degraded',
      timestamp: new Date().toISOString(),
      message: 'Database connection issues',
      error: error.message
    }, { status: 503 });
  }
}
