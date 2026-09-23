import { NextResponse } from "next/server";
import { authenticatedSupabaseUser } from "@/lib/supabase/authenticated-user.server";
import { getClient } from "@/lib/supabase-service";
import { logger } from '@/lib/logger';
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const user = await authenticatedSupabaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Billing verification is unavailable" }, { status: 503 });
    }

    const db = getClient();
    const { data: subscriptions, error: subscriptionError } = await db
      .from("subscriptions")
      .select("stripe_subscription_id,status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("updated_at", { ascending: false })
      .limit(2);

    if (subscriptionError) throw subscriptionError;
    if (!subscriptions?.length) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }
    if (subscriptions.length > 1) {
      logger.error("Multiple active Stripe subscriptions found for one user", { userId: user.id });
      return NextResponse.json({ error: "Billing needs review before cancellation. Contact support." }, { status: 409 });
    }

    const subscriptionId = subscriptions[0]?.stripe_subscription_id;
    if (typeof subscriptionId !== "string" || !subscriptionId.startsWith("sub_")) {
      return NextResponse.json({ error: "Subscription record is invalid" }, { status: 409 });
    }

    const current = await stripe.subscriptions.retrieve(subscriptionId);
    if (current.metadata?.userId && current.metadata.userId !== user.id) {
      logger.error("Stripe cancellation owner mismatch", { subscriptionId });
      return NextResponse.json({ error: "Subscription ownership could not be verified" }, { status: 409 });
    }

    const updated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    const { error: updateError } = await db
      .from("subscriptions")
      .update({
        status: updated.status,
        cancel_at_period_end: updated.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId)
      .eq("user_id", user.id);
    if (updateError) throw updateError;

    // Keep paid entitlement until Stripe actually ends/deletes the subscription.
    // The signature-verified webhook remains authoritative for the downgrade.
    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      status: updated.status,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error("Cancel subscription failed", error);
    return NextResponse.json({ error: "Unable to update the subscription. Please try again." }, { status: 500 });
  }
}
