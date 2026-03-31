import { NextResponse } from "next/server"
import templates from "@/data/templates"

export async function GET(
  req: Request,
  { params }: { params: { name: string } }
) {
  const tpl = templates[params.name]
  if (!tpl) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(tpl)
}
