import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { message } = await req.json()

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: "gemini-pro" })

  const result = await model.generateContent(message)
  const response = await result.response
  const text = response.text()

  return NextResponse.json({ text })
}
