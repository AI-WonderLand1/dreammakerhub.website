import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@lib/supabase/server-client";

const OPTIMIZER_URL = process.env.OPTIMIZER_SERVICE_URL || "http://localhost:3090";

interface MergeRequest {
  characterUrl: string;
  sceneUrl: string;
  outputName?: string;
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return true;
  }

  // Block direct IPv4 private/link-local/loopback ranges.
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map(Number);
    if (octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) {
      return true;
    }

    const [a, b] = octets;
    if (
      a === 10 || // 10.0.0.0/8
      (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
      (a === 192 && b === 168) || // 192.168.0.0/16
      a === 127 || // loopback
      (a === 169 && b === 254) // link-local
    ) {
      return true;
    }
  }

  return false;
}

function validateExternalAssetUrl(rawUrl: string, fieldName: "characterUrl" | "sceneUrl"): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`${fieldName} must be a valid absolute URL`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${fieldName} must use http or https`);
  }

  if (parsed.username || parsed.password) {
    throw new Error(`${fieldName} must not include URL credentials`);
  }

  if (isPrivateOrLocalHost(parsed.hostname)) {
    throw new Error(`${fieldName} targets a disallowed host`);
  }

  return parsed.toString();
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

  let safeCharacterUrl: string;
  let safeSceneUrl: string;
  try {
    safeCharacterUrl = validateExternalAssetUrl(characterUrl, "characterUrl");
    safeSceneUrl = validateExternalAssetUrl(sceneUrl, "sceneUrl");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid asset URL" },
      { status: 400 }
    );
  }

  try {
    const [characterRes, sceneRes] = await Promise.all([
      fetch(safeCharacterUrl, { redirect: "manual" }),
      fetch(safeSceneUrl, { redirect: "manual" }),
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
    const validatedUrl = validateExternalAssetUrl(url, "url");
    const response = await fetch(validatedUrl, { redirect: "manual" });
    
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