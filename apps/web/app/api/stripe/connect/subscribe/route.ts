import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { logger } from '@/lib/logger';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
const SAAS_PRICE_ID = process.env.STRIPE_SAAS_PRICE_ID;

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
    if (!SAAS_PRICE_ID) {
      return NextResponse.json({ error: "STRIPE_SAAS_PRICE_ID not set. Run scripts/stripe-seed-saas-plan.ts first" }, { status: 500 });
    }

    const body = await request.json();
    const { accountId } = body ?? {};

    if (!accountId) {
      return NextResponse.json({ error: "accountId required" }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.create({
      customer: accountId,
      items: [{ price: SAAS_PRICE_ID }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: (subscription.latest_invoice as Stripe.Invoice).payment_intent
        ? (subscription.latest_invoice as Stripe.Invoice).payment_intent!.client_secret
        : null,
    });
  } catch (err: any) {
    logger.error("Stripe subscription binding error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
