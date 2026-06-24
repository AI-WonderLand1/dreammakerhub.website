import { runModel } from "@core/ai/runModel"
import { NextResponse } from "next/server"

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { message } = await req.json()

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  try {
    const result = await runModel({
      model: "openrouter/google/gemini-flash-1.5",
      messages: [{ role: "user", content: message }]
    })
    return NextResponse.json({ text: result.text || "" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI error" }, { status: 500 })
  }
}
