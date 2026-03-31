import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const prompt = String(body?.prompt ?? "").trim();
  const currentData = body?.currentData;

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  if (!currentData || !Array.isArray(currentData.content)) {
    return NextResponse.json({ error: "currentData.content must be provided" }, { status: 400 });
  }

  if (prompt.toLowerCase().includes("patch")) {
    return NextResponse.json({
      patch: [
        {
          op: "add",
          path: "/content/-",
          value: {
            type: "Text",
            props: { text: `AI patch note: ${prompt}` },
          },
        },
      ],
    });
  }

  return NextResponse.json({
    nextData: {
      content: [
        ...currentData.content,
        {
          type: "Section",
          props: { title: `AI generated section: ${prompt}` },
        },
      ],
    },
  });
}
