import { runModel } from "@core/ai/runModel"
<<<<<<< HEAD
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const AI_PROVIDER = process.env.AI_PROVIDER || "opencode"
=======
import { NextResponse } from "next/server"

export const runtime = "nodejs";
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

export async function POST(req: Request) {
  const { message } = await req.json()

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

<<<<<<< HEAD
  let text = ""

  if (AI_PROVIDER === "google") {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 503 })
    }
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent(message)
    const response = await result.response
    text = response.text()
  } else {
    const result = await runModel({
      model: "opencode/big-pickle",
      messages: [{ role: "user", content: message }]
    })
    text = result.text || ""
  }

  return NextResponse.json({ text })
=======
  try {
    const result = await runModel({
      model: "groq/llama-3.1-8b-instant",
      messages: [{ role: "user", content: message }]
    })
    return NextResponse.json({ text: result.text || "" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI error" }, { status: 500 })
  }
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
}
