import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe";

function getBearerToken(req: NextRequest) {
  const match = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function sanitizeRedirectPath(raw: unknown): string {
  if (typeof raw !== "string") return "/dashboard/projects";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://") || /[\\\r\n\t]/.test(trimmed)) {
    return "/dashboard/projects";
  }
  return trimmed;
}

function publicSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://dreammakerhub.website";
  const url = new URL(configured);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) {
    throw new Error("Public checkout origin must be HTTPS");
  }
  return url;
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ error: "Please sign in before checkout" }, { status: 401 });

    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
    }
    const { plan, interval, redirectTo: rawRedirectTo } = body as Record<string, unknown>;
    if (typeof plan !== "string" || !Object.prototype.hasOwnProperty.call(PLANS, plan)) {
      return NextResponse.json({ error: "Invalid plan selection" }, { status: 400 });
    }
    if (interval !== undefined && interval !== "month" && interval !== "year") {
      return NextResponse.json({ error: "Invalid billing interval" }, { status: 400 });
    }
    const isYearly = interval === "year";
    const redirectTo = sanitizeRedirectPath(rawRedirectTo);
    const planConfig = PLANS[plan as PlanId];
    if (planConfig.price === 0 || planConfig.id === "enterprise") {
      return NextResponse.json({ error: "This plan does not use paid self-service checkout" }, { status: 400 });
    }
    const priceId = isYearly ? planConfig.stripePriceYearlyId : planConfig.stripePriceId;
    if (!priceId) {
      return NextResponse.json({ error: "The selected plan is not configured for checkout. Contact support." }, { status: 503 });
    }
    if (!stripe) {
      return NextResponse.json({ error: "Payment processing is temporarily unavailable" }, { status: 503 });
    }

    // Authentication uses publishable keys on newer Supabase projects; the legacy anon key is optional.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !publicKey) {
      return NextResponse.json({ error: "Authentication is temporarily unavailable" }, { status: 503 });
    }

    const supabase = createClient(url, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user?.id) {
      return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
    }

    // Do not charge the customer a different amount, currency, or billing cycle
    // if a deployment points at an outdated or incorrectly configured Stripe Price.
    const stripePrice = await stripe.prices.retrieve(priceId);
    const expectedAmount = isYearly ? planConfig.yearlyPrice : planConfig.price;
    if (expectedAmount === undefined || !stripePrice.active || stripePrice.type !== "recurring" ||
        stripePrice.currency !== "usd" || stripePrice.unit_amount !== expectedAmount ||
        stripePrice.recurring?.interval !== (isYearly ? "year" : "month") ||
        stripePrice.recurring?.usage_type !== "licensed") {
      logger.error("Stripe subscription price does not match the advertised plan", {
        plan: planConfig.id, interval: isYearly ? "year" : "month", priceId,
      });
      return NextResponse.json({ error: "The selected plan's payment configuration does not match its displayed price. Please contact support." }, { status: 503 });
    }

    const baseUrl = publicSiteUrl();
    const successUrl = new URL("/checkout/success", baseUrl);
    successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
    successUrl.searchParams.set("redirectTo", redirectTo);
    // Stripe replaces the literal token, not its URLSearchParams-encoded braces.
    const stripeSuccessUrl = successUrl.toString().replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");
    const cancelUrl = new URL("/subscription", baseUrl);
    cancelUrl.searchParams.set("canceled", "true");
    cancelUrl.searchParams.set("redirectTo", redirectTo);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan: planConfig.id, interval: isYearly ? "year" : "month" },
      subscription_data: { metadata: { userId: user.id, plan: planConfig.id } },
      success_url: stripeSuccessUrl,
      cancel_url: cancelUrl.toString(),
    });
    if (!session.url || !session.url.startsWith("https://")) {
      logger.error("Stripe did not return a secure checkout URL", { sessionId: session.id });
      return NextResponse.json({ error: "Could not open secure checkout. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ success: true, url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error("Stripe checkout initialization failed", error);
    return NextResponse.json({ error: "Unable to start checkout. Please try again or contact support." }, { status: 502 });
  }
}
