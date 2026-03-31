// functions/signup_rate_limiter/index.ts
import { Client } from "npm:pg@8.11.0";

interface Payload {
  user_id?: string;
  ip: string;
}

const RATE_LIMIT_WINDOW_MINUTES = 60; // window duration
const MAX_ATTEMPTS_PER_WINDOW = 5;    // threshold

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" }});
    }

    const payload: Payload = await req.json();
    if (!payload?.ip) {
      return new Response(JSON.stringify({ error: "Missing ip in body" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: "SUPABASE_DB_URL not set" }), { status: 500, headers: { "Content-Type": "application/json" }});
    }

    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    // Count recent attempts from this IP in the window
    const res = await client.queryObject<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM public.signup_attempts
       WHERE ip = $1
         AND created_at > now() - ($2 || ' minutes')::interval`,
      [payload.ip, RATE_LIMIT_WINDOW_MINUTES]
    );

    const count = parseInt(res.rows[0].count, 10);

    if (count >= MAX_ATTEMPTS_PER_WINDOW) {
      await client.end();
      return new Response(JSON.stringify({ allowed: false, reason: "rate_limited" }), { status: 429, headers: { "Content-Type": "application/json" }});
    }

    // Insert the attempt
    await client.queryObject(
      `INSERT INTO public.signup_attempts (user_id, ip) VALUES ($1, $2)`,
      [payload.user_id ?? null, payload.ip]
    );

    await client.end();

    return new Response(JSON.stringify({ allowed: true }), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
});
