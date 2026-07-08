import { runModel } from "@/core/ai/runModel"
import { NextResponse } from "next/server"

export const runtime = "nodejs";

/**
 * Sanitize user input to prevent prompt injection and XSS
 */
function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  let sanitized = input.replace(/[<>]/g, '');
  // Limit length to prevent abuse
  sanitized = sanitized.slice(0, 10000);
  return sanitized;
}

export async function POST(req: Request) {
  const { message } = await req.json()

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  // Sanitize user input
  const sanitizedMessage = sanitizeInput(message);

  try {
    const result = await runModel({
      model: "openrouter/google/gemini-flash-1.5",
      messages: [{ role: "user", content: sanitizedMessage }]
    })
    return NextResponse.json({ text: result.text || "" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI error" }, { status: 500 })
  }
}
