import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Storage recovery is disabled (MegaProvider removed). Connect a Supabase storage provider to enable this route.",
    },
    { status: 501 }
  );
}
