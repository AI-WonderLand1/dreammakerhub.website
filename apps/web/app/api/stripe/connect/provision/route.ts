import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { logger } from '@/lib/logger';
import { stripe } from "@/lib/stripe";
const SAAS_PRICE_ID = process.env.STRIPE_SAAS_PRICE_ID;

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !SAAS_PRICE_ID) {
      return NextResponse.json({
        error: "Stripe not configured or STRIPE_SAAS_PRICE_ID not set. Run seed script first."
      }, { status: 500 });
    }

    const body = await request.json();
    const clientIp = body?.ip || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "172.0.0.0";
    const country = body?.country || "US";
    const phone = body?.phone || "0000000000";

    const account = await stripe.v2.core.accounts.create({
      identity: {
        country,
        business_details: { phone },
        attestations: {
          terms_of_service: {
            account: {
              date: new Date().toISOString(),
              ip: clientIp,
            },
          },
        },
      },
      dashboard: "full",
      defaults: {
        responsibilities: {
          losses_collector: "stripe",
          fees_collector: "stripe",
        },
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: account.id,
      items: [{ price: SAAS_PRICE_ID }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });

    return NextResponse.json({
      success: true,
      accountId: account.id,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      clientSecret: (subscription.latest_invoice as Stripe.Invoice).payment_intent
        ? (subscription.latest_invoice as Stripe.Invoice).payment_intent!.client_secret
        : null,
    });
  } catch (err: any) {
    logger.error("Provisioning error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
