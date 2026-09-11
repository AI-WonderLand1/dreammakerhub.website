import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUsableSupabaseValue(value: string | undefined) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && !normalized.includes("placeholder") && !normalized.includes("invalid");
}

function isUsableSupabaseUrl(value: string | undefined) {
  if (!isUsableSupabaseValue(value)) return false;
  try {
    const parsed = new URL(value!);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export async function GET() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)?.trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!isUsableSupabaseUrl(url) || !isUsableSupabaseValue(anonKey)) {
    // Do not print secret values. This error happens before any request reaches
    // Supabase, so it will not appear in the Supabase Auth logs.
    console.error("[supabase-config] Runtime authentication configuration unavailable", {
      hasValidUrl: isUsableSupabaseUrl(url),
      hasPublishableKey: isUsableSupabaseValue(anonKey),
    });

    return NextResponse.json(
      { error: "Authentication configuration is unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return NextResponse.json(
    { url, anonKey },
    { headers: { "Cache-Control": "no-store" } },
  );
}
