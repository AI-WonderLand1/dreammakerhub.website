import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';
import { stripe } from "@/lib/stripe";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function stripeId(value: string | { id: string } | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function syncAuthPlan(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  plan: string,
) {
  const { data, error: getUserError } = await supabase.auth.admin.getUserById(userId);
  if (getUserError) throw getUserError;

  const appMetadata = data.user?.app_metadata ?? {};
  const { error: updateUserError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { ...appMetadata, plan },
  });
  if (updateUserError) throw updateUserError;
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (STRIPE_WEBHOOK_SECRET && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
      } catch (err: any) {
        logger.error("Webhook signature verification failed:", err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      logger.error("Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured or signature missing");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const interval = session.metadata?.interval || "month";
        const customerId = stripeId(session.customer);
        const subscriptionId = stripeId(session.subscription);

        if (!userId || !plan || !subscriptionId) {
          throw new Error("Stripe checkout completed without required user, plan, or subscription metadata");
        }

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

        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId,
              plan,
              interval,
              status: "active",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" },
          );
        if (subscriptionError) throw subscriptionError;

        await syncAuthPlan(supabase, userId, plan);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const { error } = await supabase
          .from("subscriptions")
          .update({ status: subscription.status, updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscription.id);
        if (error) throw error;
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

        const userId = subscriptionRow?.user_id;
        if (userId) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ subscription_tier: "free", updated_at: new Date().toISOString() })
            .eq("id", userId);
          if (profileError) throw profileError;

          await syncAuthPlan(supabase, userId, "free");
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

    return NextResponse.json({ received: true });
  } catch (err: any) {
    logger.error("Webhook error:", err);
    return NextResponse.json({ error: err?.message || "Webhook processing failed" }, { status: 500 });
  }
}
