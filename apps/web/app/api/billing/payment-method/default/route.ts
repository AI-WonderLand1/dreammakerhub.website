import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { authenticatedSupabaseUser } from "@/lib/supabase/authenticated-user.server";
import { resolveStripeCustomer } from "@/lib/billing/stripe-customer.server";

export async function POST(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!stripe) return NextResponse.json({ error: "Billing processor is unavailable" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const setupIntentId = typeof (body as any).setupIntentId === "string"
    ? (body as any).setupIntentId.trim()
    : "";
  const paymentMethodId = typeof (body as any).paymentMethodId === "string"
    ? (body as any).paymentMethodId.trim()
    : "";
  if (!setupIntentId || !paymentMethodId) {
    return NextResponse.json({ error: "setupIntentId and paymentMethodId are required" }, { status: 400 });
  }

  const { customerId } = await resolveStripeCustomer(user, { createIfMissing: true });
  if (!customerId) return NextResponse.json({ error: "Billing account is unavailable" }, { status: 503 });

  const [setupIntent, paymentMethod] = await Promise.all([
    stripe.setupIntents.retrieve(setupIntentId),
    stripe.paymentMethods.retrieve(paymentMethodId),
  ]);

  const setupCustomer = typeof setupIntent.customer === "string"
    ? setupIntent.customer
    : setupIntent.customer?.id || null;
  const setupPaymentMethod = typeof setupIntent.payment_method === "string"
    ? setupIntent.payment_method
    : setupIntent.payment_method?.id || null;
  const attachedCustomer = typeof paymentMethod.customer === "string"
    ? paymentMethod.customer
    : paymentMethod.customer?.id || null;

  if (
    setupIntent.status !== "succeeded" ||
    setupCustomer !== customerId ||
    setupPaymentMethod !== paymentMethodId ||
    attachedCustomer !== customerId ||
    setupIntent.metadata?.dreammakerhubUserId !== user.id
  ) {
    return NextResponse.json({ error: "Payment method setup could not be verified" }, { status: 403 });
  }

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
  await Promise.all(
    subscriptions.data
      .filter((subscription) => ["active", "trialing", "past_due"].includes(subscription.status))
      .map((subscription) => stripe.subscriptions.update(subscription.id, {
        default_payment_method: paymentMethodId,
      })),
  );

  return NextResponse.json({
    paymentMethod: paymentMethod.card ? {
      id: paymentMethod.id,
      brand: paymentMethod.card.brand || null,
      funding: paymentMethod.card.funding || null,
      last4: paymentMethod.card.last4 || null,
      expMonth: paymentMethod.card.exp_month || null,
      expYear: paymentMethod.card.exp_year || null,
    } : null,
  }, { headers: { "Cache-Control": "no-store" } });
}
