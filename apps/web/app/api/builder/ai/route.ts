import { NextResponse } from "next/server";
import crypto from "crypto";
import { appendAIConfession } from "@core/projects/aiConfessions";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Provider = "openai" | "gemini";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function stripScripts(html: string) {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

async function callOpenAI(apiKey: string, prompt: string) {
  // NOTE: model name may vary in your account; adjust if needed.
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            'You are a website builder assistant. Output ONLY strict JSON: {"message": string, "html": string, "css": string}. No markdown. No extra keys.',
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI error ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  return content;
}

async function callGemini(apiKey: string, prompt: string) {
  // Gemini REST API: key in query param.
  // NOTE: model name may vary; this is a common one.
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
    encodeURIComponent(apiKey);

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                'Output ONLY strict JSON: {"message": string, "html": string, "css": string}. No markdown. No extra keys.\n\n' +
                prompt,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.2 },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini error ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  const content =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text ?? "")
      .join("") ?? "";
  return content;
}

export async function POST(req: Request) {
  try {
    // Provider passed by client (defaults to gemini if missing)
    const provider =
      ((req.headers.get("x-ai-provider") || "gemini") as Provider) ?? "gemini";

    // Key passed via Authorization: Bearer <key>
    const auth = req.headers.get("authorization") || "";
    const apiKey = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

    if (!apiKey)
      return jsonError("Missing BYOK key. Add your key in AI settings.", 401);
    if (provider !== "openai" && provider !== "gemini")
      return jsonError("Unsupported provider.");

    const body = await req.json().catch(() => null);
    const prompt = (body?.prompt ?? "").toString().trim();
    if (!prompt) return jsonError("Missing prompt.");

    // Build the final instruction prompt.
    // Keep this concise, but explicit.
    const fullPrompt = `
You are helping a user build a website.

Rules:
- Never output <script> tags.
- Return full HTML + CSS for the page (not an explanation).
- Keep styles in CSS only when possible.

Task:
${prompt}
`.trim();

    const raw =
      provider === "openai"
        ? await callOpenAI(apiKey, fullPrompt)
        : await callGemini(apiKey, fullPrompt);

    // Try parse strict JSON; if it fails, wrap it.
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Sometimes models include extra text; attempt to extract JSON block
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(raw.slice(start, end + 1));
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed || typeof parsed !== "object") {
      // Fallback: return message only
      return NextResponse.json({
        message:
          "AI returned a non-JSON response. Adjust prompt or provider/model.",
        raw,
      });
    }

    const message = String(parsed.message ?? "Done.");
    const html = stripScripts(String(parsed.html ?? ""));
    const css = String(parsed.css ?? "");

    return NextResponse.json(
      { message, html, css },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "AI route error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
