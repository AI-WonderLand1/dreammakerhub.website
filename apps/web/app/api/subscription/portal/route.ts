import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: userRes } = await supabase.auth.getUser(token);
    if (!userRes?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const [{ data: profile }, { data: subscription }] = await Promise.all([
      supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userRes.user.id)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", userRes.user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const customerId = profile?.stripe_customer_id || subscription?.stripe_customer_id || null;
    if (!customerId) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://dreammakerhub.website";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard/usage`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    logger.error("Portal error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
