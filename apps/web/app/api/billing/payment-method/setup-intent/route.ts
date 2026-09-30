import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { authenticatedSupabaseUser } from "@/lib/supabase/authenticated-user.server";
import { resolveStripeCustomer } from "@/lib/billing/stripe-customer.server";

export async function POST(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!stripe) return NextResponse.json({ error: "Billing processor is unavailable" }, { status: 503 });

  const publishableKey = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim();
  if (!publishableKey) {
    return NextResponse.json({ error: "Secure card entry is not configured" }, { status: 503 });
  }

  const { customerId } = await resolveStripeCustomer(user, { createIfMissing: true });
  if (!customerId) return NextResponse.json({ error: "Could not create billing account" }, { status: 500 });

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: "off_session",
    payment_method_types: ["card"],
    metadata: { dreammakerhubUserId: user.id },
  });

  if (!setupIntent.client_secret) {
    return NextResponse.json({ error: "Could not initialize secure card entry" }, { status: 502 });
  }

  return NextResponse.json({
    clientSecret: setupIntent.client_secret,
    publishableKey,
  }, { headers: { "Cache-Control": "no-store" } });
}
