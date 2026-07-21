import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

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

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("id", userRes.user.id)
      .single();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    await stripe.subscriptions.cancel(profile.stripe_subscription_id);

    await supabase
      .from("user_profiles")
      .update({
        subscription_plan: "free",
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userRes.user.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error("Cancel error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
