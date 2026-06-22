// supabase/functions/gesture-memory/index.ts
// Stores and retrieves per‑user gesture pattern memory via Mem0's
// hosted Platform API (api.mem0.ai). Separate function from
// ai‑playground‑stream — different payload shape, called on every
// confirmed gesture rather than occasional playground prompts.
//
// Deploy: supabase functions deploy gesture-memory
// Secret:  supabase secrets set MEM0_API_KEY=your_mem0_key

import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const MEM0_API_BASE = "https://api.mem0.ai";
const MEM0_API_KEY = Deno.env.get("MEM0_API_KEY");

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return new Response("Unsupported Media Type", { status: 415 });
    }
    if (!MEM0_API_KEY) {
      return new Response(JSON.stringify({ error: "MEM0_API_KEY not configured" }), { status: 500 });
    }
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), { status: 401 });
    }
    const userToken = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
    );
    const { data: userData, error: userError } = await supabase.auth.getUser(userToken);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401 });
    }
    const userId = userData.user.id;
    const payload = await req.json().catch(() => null);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Bad request: invalid JSON" }), { status: 400 });
    }
    const { action } = payload as { action?: "log" | "get" };
    if (action === "log") return await handleLog(userId, payload);
    if (action === "get") return await handleGet(userId, payload);
    return new Response(JSON.stringify({ error: "action must be 'log' or 'get'" }), { status: 400 });
  } catch (err) {
    console.error("gesture-memory error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});

async function handleLog(userId: string, payload: any) {
  const { gesture, outcome, accuracy, customThreshold } = payload;
  if (!gesture) {
    return new Response(JSON.stringify({ error: "gesture is required" }), { status: 400 });
  }
  const res = await fetch(`${MEM0_API_BASE}/v1/memories/`, {
    method: "POST",
    headers: {
      "Authorization": `Token ${MEM0_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: `Gesture "${gesture}" performed. Outcome: ${outcome ?? "unknown"}. Accuracy: ${accuracy ?? "n/a"}. Custom threshold: ${customThreshold ?? "default"}.` }],
      user_id: userId,
      metadata: { type: "gesture_pattern", gesture, accuracy, customThreshold },
    }),
  });
  if (!res.ok) {
    console.error("Mem0 add failed:", await res.text());
    return new Response(JSON.stringify({ error: "Failed to store gesture memory" }), { status: 502 });
  }
  const data = await res.json();
  return new Response(JSON.stringify({ ok: true, result: data }), { headers: { "Content-Type": "application/json" } });
}

async function handleGet(userId: string, payload: any) {
  const { gesture } = payload;
  const res = await fetch(`${MEM0_API_BASE}/v1/memories/search/`, {
    method: "POST",
    headers: {
      "Authorization": `Token ${MEM0_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: gesture ? `gesture pattern for ${gesture}` : "gesture patterns", user_id: userId }),
  });
  if (!res.ok) {
    console.error("Mem0 search failed:", await res.text());
    return new Response(JSON.stringify({ error: "Failed to retrieve gesture memory" }), { status: 502 });
  }
  const data = await res.json();
  return new Response(JSON.stringify({ ok: true, result: data }), { headers: { "Content-Type": "application/json" } });
}
