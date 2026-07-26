import { NextResponse } from "next/server";
import { getSecretFromVault } from "@/lib/oracle-vault";

export async function GET() {
  try {
    const [url, anonKey] = await Promise.all([
      getSecretFromVault('NEXT_PUBLIC_SUPABASE_URL'),
      getSecretFromVault('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    ]);

    if (!url || !anonKey) {
      return NextResponse.json({ error: "Supabase configuration not found" }, { status: 404 });
    }

    return NextResponse.json({ url, anonKey });
  } catch (error: any) {
    console.error("Error fetching Supabase config from vault:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
