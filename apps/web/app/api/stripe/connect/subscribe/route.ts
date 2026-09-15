import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireUserId } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { stripe } from "@/lib/stripe";

const SAAS_PRICE_ID = process.env.STRIPE_SAAS_PRICE_ID;

function connectEnabled(): boolean {
  return process.env.STRIPE_CONNECT_ENABLED === "true";
}

function accountTokenValid(userId: string, accountId: string, provided: string): boolean {
  const secret = process.env.STRIPE_CONNECT_STATE_SECRET?.trim();
  if (!secret || !provided) return false;
  const expected = createHmac("sha256", secret).update(`${userId}:${accountId}`).digest("hex");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!connectEnabled()) {
    return NextResponse.json({ error: "Stripe Connect subscriptions are disabled" }, { status: 503 });
  }

  try {
    if (!stripe || !SAAS_PRICE_ID || !process.env.STRIPE_CONNECT_STATE_SECRET?.trim()) {
      return NextResponse.json({ error: "Stripe Connect is not fully configured" }, { status: 500 });
    }

    const body = await request.json().catch(() => null);
    const accountId = typeof body?.accountId === "string" ? body.accountId.trim() : "";
    const token = typeof body?.accountToken === "string" ? body.accountToken.trim() : "";

    if (!accountId || !token) {
      return NextResponse.json({ error: "accountId and accountToken required" }, { status: 400 });
    }
    if (!accountTokenValid(userId, accountId, token)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subscription = await stripe.subscriptions.create({
      customer: accountId,
      items: [{ price: SAAS_PRICE_ID }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });

    logger.info("Stripe subscription created", { userId, accountId, subscriptionId: subscription.id });
    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: (subscription.latest_invoice as Stripe.Invoice).payment_intent
        ? (subscription.latest_invoice as Stripe.Invoice).payment_intent!.client_secret
        : null,
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    logger.error("Stripe subscription binding error:", err);
    return NextResponse.json({ error: "Stripe subscription creation failed" }, { status: 500 });
  }
}
