import { NextResponse } from "next/server";

function isUsableSupabaseValue(value: string | undefined) {
  return !!value && !value.includes("placeholder") && !value.includes("invalid");
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!isUsableSupabaseValue(url) || !isUsableSupabaseValue(anonKey)) {
    return NextResponse.json({ error: "Supabase configuration not found" }, { status: 404 });
  }

  return NextResponse.json({ url, anonKey });
}
