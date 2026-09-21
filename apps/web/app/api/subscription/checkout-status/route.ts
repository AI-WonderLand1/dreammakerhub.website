import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId) || sessionId.length > 256) {
    return NextResponse.json({ error: "Invalid checkout session" }, { status: 400 });
  }
  const bearer = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return NextResponse.json({ error: "Sign in to verify your checkout" }, { status: 401 });
  if (!stripe) return NextResponse.json({ error: "Payment verification is unavailable" }, { status: 503 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !publicKey) {
    return NextResponse.json({ error: "Authentication is temporarily unavailable" }, { status: 503 });
  }

  try {
    const supabase = createClient(url, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error } = await supabase.auth.getUser(bearer);
    if (error || !user?.id) return NextResponse.json({ error: "Session expired" }, { status: 401 });

    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    if (!checkout.metadata?.userId || checkout.metadata.userId !== user.id || checkout.client_reference_id !== user.id) {
      // Do not reveal whether a session belongs to another account.
      return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
    }

    const complete = checkout.status === "complete" &&
      (checkout.payment_status === "paid" || checkout.payment_status === "no_payment_required") &&
      Boolean(checkout.subscription);

    return NextResponse.json({
      complete,
      plan: complete ? checkout.metadata.plan : null,
      message: complete
        ? "Stripe confirmed checkout. Your subscription access may take a moment to sync."
        : "Checkout is not yet complete. No subscription has been confirmed.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error("Stripe checkout verification failed", error);
    return NextResponse.json({ error: "Unable to verify checkout. Check your billing dashboard or contact support." }, { status: 502 });
  }
}
