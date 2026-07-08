import { createClient } from '@supabase/supabase-js';

let supabaseAdmin = null;

function getSupabase() {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  supabaseAdmin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return supabaseAdmin;
}

export async function authMiddleware(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }

    const { data: tokenRow, error: tokenError } = await supabase
      .from('coder_user_tokens')
      .select('coder_token')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenRow) {
      return reply.code(403).send({ error: 'No Coder token configured for this user' });
    }

    request.user = user;
    request.coderToken = tokenRow.coder_token;
  } catch (err) {
    request.log.error(err, 'Auth middleware error');
    return reply.code(500).send({ error: 'Authentication failed' });
  }
}
