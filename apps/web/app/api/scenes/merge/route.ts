import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@lib/supabase/server-client";
import { ssrfFetch, SsrfError } from "@/lib/ssrf-safe-fetch";

const OPTIMIZER_URL = process.env.OPTIMIZER_SERVICE_URL || "http://localhost:3090";

const ALLOWED_ASSET_HOSTS = [
  "playcanvas.com",
  "cdn.playcanvas.com",
  "sketchfab.com",
  "media.sketchfab.com",
  "polyhaven.com",
  "dl.polyhaven.org",
  "github.com",
  "raw.githubusercontent.com",
  "supabase.co",
] as const;

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
      ssrfFetch(characterUrl, { allowedHosts: ALLOWED_ASSET_HOSTS }),
      ssrfFetch(sceneUrl, { allowedHosts: ALLOWED_ASSET_HOSTS }),
    ]);

    if (characterRes.status >= 300 && characterRes.status < 400) {
      return NextResponse.json(
        { error: "Character URL redirects are not allowed" },
        { status: 400 }
      );
    }

    if (sceneRes.status >= 300 && sceneRes.status < 400) {
      return NextResponse.json(
        { error: "Scene URL redirects are not allowed" },
        { status: 400 }
      );
    }

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

    const safeName = (outputName || `merged-${Date.now()}`).replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `${safeName}.glb`;
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
    const response = await ssrfFetch(url, { allowedHosts: ALLOWED_ASSET_HOSTS });
    
    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({
        mergeAvailable: false,
        url,
        error: "URL redirects are not allowed",
      });
    }
    
    return NextResponse.json({
      mergeAvailable: response.ok,
      url,
    });
  } catch (error) {
    return NextResponse.json({
      mergeAvailable: false,
      url,
      error: error instanceof Error ? error.message : "Invalid URL",
    });
  }
}