import { NextResponse } from "next/server";

function isPlaceholderValue(value: string) {
  return value.includes("placeholder") || value.includes("invalid");
}

function isUsableSupabaseUrl(value: string | undefined) {
  return !!value && !isPlaceholderValue(value);
}

function isUsableSupabaseAnonKey(value: string | undefined) {
  if (!value || isPlaceholderValue(value)) return false;

  const parts = value.split(".");
  if (parts.length !== 3) return false;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload.role === "anon" && typeof payload.ref === "string";
  } catch {
    return false;
  }
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!isUsableSupabaseUrl(url) || !isUsableSupabaseAnonKey(anonKey)) {
    return NextResponse.json({ error: "Supabase configuration not found" }, { status: 404 });
  }

  return NextResponse.json({ url, anonKey });
}
