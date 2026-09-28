import { NextResponse } from "next/server";
import { PAID_PLANS } from "@/lib/billing/plans";
import { stripe } from "@/lib/stripe";

export async function GET() {
  // Report the same advertised amounts used by the checkout price-validation
  // endpoint. Configured product IDs are not proof of payable prices: checkout
  // looks up and validates the live recurring Stripe Price before charging.
  const plans = Object.fromEntries(PAID_PLANS.map((plan) => [
    plan.id,
    {
      id: plan.id,
      name: plan.displayName,
      description: plan.description,
      amount: plan.price,
      annualAmount: plan.yearlyPrice,
      currency: "usd",
      interval: "month",
      monthlyConfigured: Boolean(stripe && (plan.stripePriceId || plan.stripeProductId)),
      yearlyConfigured: Boolean(stripe && (plan.stripePriceYearlyId || plan.stripeProductId)),
    },
  ]));

  return NextResponse.json({
    // The publishable key is public, never include STRIPE_SECRET_KEY here.
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
    configured: Boolean(stripe && PAID_PLANS.every((plan) =>
      plan.stripeProductId || (plan.stripePriceId && plan.stripePriceYearlyId))),
    plans,
  }, { headers: { "Cache-Control": "no-store" } });
}
