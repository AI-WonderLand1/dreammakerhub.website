import { createClient } from '../../../utils/supabase/server';

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.storage.listBuckets();
    
    return Response.json({ 
      status: error ? 'degraded' : 'operational',
      timestamp: new Date().toISOString(),
      message: error ? 'Storage issues detected' : 'Storage services healthy',
      details: {
        buckets: data?.length || 0,
        error: error?.message
      }
    });
  } catch (error) {
    return Response.json({ 
      status: 'major_outage',
      timestamp: new Date().toISOString(),
      message: 'Storage services unavailable',
      error: error.message
    }, { status: 503 });
  }
}
