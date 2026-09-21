import { NextResponse } from "next/server";
import { PAID_PLANS } from "@/lib/billing/plans";
import { stripe } from "@/lib/stripe";

export async function GET() {
  // Report the same advertised amounts used by the checkout price-validation
  // endpoint. A configured price ID is not proof it matches Stripe: checkout
  // retrieves and validates the live recurring Price before creating a session.
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
      monthlyConfigured: Boolean(stripe && plan.stripePriceId),
      yearlyConfigured: Boolean(stripe && plan.stripePriceYearlyId),
    },
  ]));

  return NextResponse.json({
    // The publishable key is public, never include STRIPE_SECRET_KEY here.
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
    configured: Boolean(stripe && PAID_PLANS.every((plan) => plan.stripePriceId && plan.stripePriceYearlyId)),
    plans,
  }, { headers: { "Cache-Control": "no-store" } });
}
