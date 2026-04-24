import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

const PLANS: Record<string, { name: string; amount: number; interval: "month" | "year" }> = {
  pro: { name: "Pro Plan", amount: 1000, interval: "month" },
  elite: { name: "Elite Plan", amount: 2500, interval: "month" },
};

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

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan selection" }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
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
    const planConfig = PLANS[plan];

    const product = await stripe.products.create({
      name: planConfig.name,
      tax_code: "txcd_10103100",
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: planConfig.amount,
      currency: "usd",
      recurring: { interval: planConfig.interval },
    });

    const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://dreammakerhub.website";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      customer_email: userEmail || undefined,
      metadata: { userId, plan },
      success_url: `${baseUrl}/subscription?success=true&plan=${plan}&redirectTo=${encodeURIComponent(redirectTo)}`,
      cancel_url: `${baseUrl}/subscription?canceled=true`,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}