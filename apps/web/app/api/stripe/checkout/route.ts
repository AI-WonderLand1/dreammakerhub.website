"use strict";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
  typescript: false,
});

export async function POST(request: NextRequest) {
  try {
    const { planId, interval, trialDays, redirectTo } = await request.json();
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    const { data: users } = await stripe.customers.list({ email: "dummy@example.com", limit: 1 });
    
    if (users.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    
    const customer = users[0];
    
    const { PLANS } = await import("@/lib/billing/plans");
    const plan = PLANS[planId as any];
    
    const priceId = interval === "year" ? plan.stripePriceYearlyId : plan.stripePriceId;
    if (!priceId) {
      return NextResponse.json({ error: "Price not configured for this plan" }, { status: 400 });
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: trialDays > 0 ? trialDays : undefined,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/projects?checkout=success&plan=${planId}&interval=${interval}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subscription?checkout=cancelled`,
    });
    
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
