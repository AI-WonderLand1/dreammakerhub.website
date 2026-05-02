import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@lib/supabase/server-client";

const OPTIMIZER_URL = process.env.OPTIMIZER_SERVICE_URL || "http://localhost:3090";

interface MergeRequest {
  characterUrl: string;
  sceneUrl: string;
  outputName?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: MergeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { characterUrl, sceneUrl, outputName } = body;

  if (!characterUrl || !sceneUrl) {
    return NextResponse.json(
      { error: "Missing required fields: characterUrl and sceneUrl" },
      { status: 400 }
    );
  }

  try {
    const [characterRes, sceneRes] = await Promise.all([
      fetch(characterUrl),
      fetch(sceneUrl),
    ]);

    if (!characterRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch character: ${characterRes.status}` },
        { status: characterRes.status }
      );
    }

    if (!sceneRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch scene: ${sceneRes.status}` },
        { status: sceneRes.status }
      );
    }

    const characterBuffer = await characterRes.arrayBuffer();
    const sceneBuffer = await sceneRes.arrayBuffer();

    const mergedBuffer = Buffer.concat([
      Buffer.from(characterBuffer),
      Buffer.from(sceneBuffer),
    ]);

    const optimizeRes = await fetch(`${OPTIMIZER_URL}/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: mergedBuffer,
    });

    let finalBuffer: ArrayBuffer;
    if (optimizeRes.ok) {
      finalBuffer = await optimizeRes.arrayBuffer();
    } else {
      console.warn("Optimization failed, using unoptimized merge");
      finalBuffer = mergedBuffer;
    }

    const fileName = outputName || `merged-${Date.now()}.glb`;
    const userId = session.user.id;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("3d-assets")
      .upload(`scenes/${userId}/${fileName}`, finalBuffer, {
        contentType: "model/gltf-binary",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to save merged scene", details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from("3d-assets")
      .getPublicUrl(`scenes/${userId}/${fileName}`);

    return NextResponse.json({
      success: true,
      mergedUrl: publicUrl,
      characterSize: characterBuffer.byteLength,
      sceneSize: sceneBuffer.byteLength,
      mergedSize: finalBuffer.byteLength,
    });
  } catch (error) {
    console.error("Scene merge error:", error);
    return NextResponse.json(
      { error: "Failed to merge scenes" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${OPTIMIZER_URL}/health`);
    return NextResponse.json({
      mergeAvailable: response.ok,
      url,
    });
  } catch (error) {
    return NextResponse.json({
      mergeAvailable: false,
      url,
      error: "Merge service not reachable",
    });
  }
}