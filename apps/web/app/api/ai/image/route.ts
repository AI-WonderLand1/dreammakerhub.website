import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { prompt, workspaceId, type } = await req.json()

  const image = await generateImage(prompt)

  const tempPath = `temp/${workspaceId}/ai/${type}/${crypto.randomUUID()}.png`

  await uploadToTemp(tempPath, image)

  return NextResponse.json({
    tempUrl: `/${tempPath}`,
    expiresIn: 3600
  })
}

// --- helpers ---
async function generateImage(prompt: string) {
  return Buffer.from("fake-image")
}

async function uploadToTemp(path: string, data: any) {
  console.log("UPLOAD TEMP:", path)
}
