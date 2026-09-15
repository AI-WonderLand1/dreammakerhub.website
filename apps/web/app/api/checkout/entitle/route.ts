import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Legacy manual entitlement endpoint.
 *
 * Entitlements must be granted only after a verified billing/provider event.
 * Keeping a browser-callable route that flips publishEnabled lets any logged-in
 * user bypass the billing decision, even if project ownership is enforced.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Manual entitlement is disabled. Entitlements are granted by verified billing events.",
    },
    {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
