import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { PLANS, type PlanId } from "@lib/billing/plans";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

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
    const { plan } = body ?? {};

    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: "Invalid plan selection" }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const planConfig = PLANS[plan as PlanId];
    
    if (!planConfig.stripePriceId) {
      return NextResponse.json({ error: "Stripe Price ID not configured for this plan. Set STRIPE_PRICE_PRO_ID and STRIPE_PRICE_TEAM_ID in .env" }, { status: 500 });
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
      payment_method_types: ["card"],
      line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
      customer_email: userEmail || undefined,
      metadata: { userId, plan },
      success_url: `${baseUrl}/subscription?success=true&plan=${plan}`,
      cancel_url: `${baseUrl}/subscription?canceled=true`,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}