import { NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(req: Request) {
  const { prompt, workspaceId, type } = await req.json()

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
  }

  const image = await generateImage(prompt)

  if (!image) {
    return NextResponse.json(
      { error: "Image generation failed. Ensure GEMINI_API_KEY is configured." },
      { status: 502 }
    )
  }

  const tempPath = `temp/${workspaceId}/ai/${type}/${crypto.randomUUID()}.png`

  await uploadToTemp(tempPath, image)

  return NextResponse.json({
    tempUrl: `/${tempPath}`,
    expiresIn: 3600
  })
}

async function generateImage(prompt: string): Promise<Buffer | null> {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not configured for image generation")
    return null
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini image generation error:", response.status, errorText)
      return null
    }

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts || []

    for (const part of parts) {
      if (part.inlineData) {
        return Buffer.from(part.inlineData.data, "base64")
      }
    }

    console.error("No image data in Gemini response")
    return null
  } catch (err) {
    console.error("Image generation error:", err)
    return null
  }
}

async function uploadToTemp(path: string, data: Buffer) {
  console.log("UPLOAD TEMP:", path, `(${data.length} bytes)`)
}
