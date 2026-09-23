import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';
import { stripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { trackFunnelEvent } from '@/lib/analytics/track-funnel-event.server';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
type PaidPlanId = Extract<PlanId, "pro" | "team">;
type BillingInterval = "month" | "year";

function stripeId(value: string | { id: string } | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function resolvedPaidPlan(subscription: Stripe.Subscription): {
  plan: PaidPlanId;
  interval: BillingInterval;
  priceId: string;
} | null {
  if (subscription.items.data.length !== 1) return null;
  const price = subscription.items.data[0]?.price;
  if (!price?.id || price.currency !== "usd" || price.type !== "recurring" || !price.recurring) return null;

  for (const id of ["pro", "team"] as const) {
    const plan = PLANS[id];
    const monthlyMatch = Boolean(plan.stripePriceId) &&
      price.id === plan.stripePriceId &&
      price.unit_amount === plan.price &&
      price.recurring.interval === "month" &&
      price.recurring.usage_type === "licensed";
    if (monthlyMatch) return { plan: id, interval: "month", priceId: price.id };

    const yearlyMatch = Boolean(plan.stripePriceYearlyId) &&
      price.id === plan.stripePriceYearlyId &&
      price.unit_amount === plan.yearlyPrice &&
      price.recurring.interval === "year" &&
      price.recurring.usage_type === "licensed";
    if (yearlyMatch) return { plan: id, interval: "year", priceId: price.id };
  }
  return null;
}

async function syncAuthPlan(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  plan: PlanId,
) {
  const { data, error: getUserError } = await supabase.auth.admin.getUserById(userId);
  if (getUserError) throw getUserError;

  const appMetadata = data.user?.app_metadata ?? {};
  const { error: updateUserError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { ...appMetadata, plan },
  });
  if (updateUserError) throw updateUserError;
}

async function syncUserTier(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  plan: PlanId,
  customerId: string | null,
) {
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        subscription_tier: plan,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  if (profileError) throw profileError;

  const { error: usageProfileError } = await supabase
    .from("user_profiles")
    .update({
      subscription_plan: plan,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (usageProfileError) throw usageProfileError;

  await syncAuthPlan(supabase, userId, plan);
}

async function persistSubscription(
  supabase: ReturnType<typeof createClient>,
  args: {
    userId: string;
    subscription: Stripe.Subscription;
    customerId: string | null;
    plan: PaidPlanId;
    interval: BillingInterval;
  },
) {
  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: args.userId,
        stripe_subscription_id: args.subscription.id,
        stripe_customer_id: args.customerId,
        plan: args.plan,
        interval: args.interval,
        status: args.subscription.status,
        price_id: args.subscription.items.data[0]?.price.id || null,
        quantity: args.subscription.items.data[0]?.quantity || 1,
        cancel_at_period_end: args.subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );
  if (error) throw error;
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!STRIPE_WEBHOOK_SECRET || !signature) {
      logger.error("Stripe webhook received without configured signing secret or signature");
      return NextResponse.json({ error: "Webhook signature unavailable" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      logger.error("Stripe webhook signature verification failed", error);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadataUserId = session.metadata?.userId;
        const metadataPlan = session.metadata?.plan;
        const customerId = stripeId(session.customer);
        const subscriptionId = stripeId(session.subscription);

        if (!metadataUserId || !subscriptionId || !["pro", "team"].includes(metadataPlan || "")) {
          throw new Error("Stripe checkout missing a valid user, paid plan, or subscription");
        }
        if (session.status !== "complete" || !["paid", "no_payment_required"].includes(session.payment_status)) {
          logger.info("Stripe checkout still awaiting payment", {
            sessionId: session.id,
            paymentStatus: session.payment_status,
          });
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const resolved = resolvedPaidPlan(subscription);
        const subscriptionUserId = subscription.metadata?.userId;
        if (!resolved || resolved.plan !== metadataPlan ||
            (subscriptionUserId && subscriptionUserId !== metadataUserId)) {
          throw new Error("Stripe subscription price or owner does not match checkout metadata");
        }
        if (subscription.status !== "active" && subscription.status !== "trialing") {
          logger.info("Stripe subscription is not active or trialing; entitlement withheld", {
            subscriptionId,
            status: subscription.status,
          });
          break;
        }

        await persistSubscription(supabase, {
          userId: metadataUserId,
          subscription,
          customerId,
          plan: resolved.plan,
          interval: resolved.interval,
        });
        await syncUserTier(supabase, metadataUserId, resolved.plan, customerId);

        if (session.payment_status === "paid") {
          await trackFunnelEvent("Subscription Started", metadataUserId, subscriptionId);
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const failedSession = event.data.object as Stripe.Checkout.Session;
        logger.warn("Stripe asynchronous payment failed; no entitlement granted by this event", {
          sessionId: failedSession.id,
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = stripeId(subscription.customer);
        const { data: existing, error: lookupError } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();
        if (lookupError) throw lookupError;

        const userId = existing?.user_id || subscription.metadata?.userId;
        if (!userId) {
          logger.warn("Stripe subscription update has no DreamMakerHub owner", {
            subscriptionId: subscription.id,
          });
          break;
        }

        const { error: statusError } = await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        if (statusError) throw statusError;

        if (subscription.status === "active" || subscription.status === "trialing") {
          const resolved = resolvedPaidPlan(subscription);
          if (!resolved) throw new Error("Active Stripe subscription uses an unrecognized price");
          await persistSubscription(supabase, {
            userId,
            subscription,
            customerId,
            plan: resolved.plan,
            interval: resolved.interval,
          });
          await syncUserTier(supabase, userId, resolved.plan, customerId);
        } else if (["canceled", "unpaid", "incomplete_expired"].includes(subscription.status)) {
          await syncUserTier(supabase, userId, "free", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = stripeId(subscription.customer);
        const { data: subscriptionRow, error: lookupError } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();
        if (lookupError) throw lookupError;

        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscription.id);
        if (subscriptionError) throw subscriptionError;

        const userId = subscriptionRow?.user_id || subscription.metadata?.userId;
        if (userId) {
          await syncUserTier(supabase, userId, "free", customerId);
        } else if (customerId) {
          logger.warn("Canceled Stripe subscription had no matching DreamMakerHub user", {
            subscriptionId: subscription.id,
            customerId,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = stripeId(invoice.customer);
        if (customerId) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_customer_id", customerId);
          if (error) throw error;
        }
        break;
      }
    }

    return NextResponse.json({ received: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error("Webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
