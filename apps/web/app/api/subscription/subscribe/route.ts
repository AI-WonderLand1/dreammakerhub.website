import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { logger } from '@/lib/logger';
import { stripe } from "@/lib/stripe";

function getBearerToken(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization token" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, interval } = body ?? {};
    const isYearly = interval === "year";

    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: "Invalid plan selection" }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const planConfig = PLANS[plan as PlanId];
    const priceId = isYearly ? planConfig.stripePriceYearlyId : planConfig.stripePriceId;

    if (!priceId) {
      return NextResponse.json({
        error: `Stripe Price ID not configured for ${plan}${isYearly ? " yearly" : ""}`
      }, { status: 500 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
      return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
    }

    const supabase = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userId = userRes.user.id;
    const userEmail = userRes.user.email;

    const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://dreammakerhub.website";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail || undefined,
      metadata: { userId, plan, interval: isYearly ? "year" : "month" },
      success_url: `${baseUrl}/subscription/success`,
      cancel_url: `${baseUrl}/subscription?canceled=true`,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (err: any) {
    logger.error("Stripe checkout error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}