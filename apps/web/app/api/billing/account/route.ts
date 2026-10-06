import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { authenticatedSupabaseUser } from "@/lib/supabase/authenticated-user.server";
import { resolveStripeCustomer } from "@/lib/billing/stripe-customer.server";
import { PLANS } from "@/lib/billing/plans";

const money = (amount: number | null | undefined, currency: string | null | undefined) => ({
  amount: Number(amount ?? 0),
  currency: (currency || "usd").toLowerCase(),
});

function membershipNameForPrice(priceId: string | null | undefined) {
  if (!priceId) return null;
  const plan = Object.values(PLANS).find(
    (candidate) => candidate.stripePriceId === priceId || candidate.stripePriceYearlyId === priceId,
  );
  return plan?.displayName ?? null;
}

function cleanText(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerId, supabase } = await resolveStripeCustomer(user);
  const { data: subscriptionRows } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id,stripe_subscription_id,plan,status,interval,price_id,cancel_at_period_end,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (!stripe || !customerId) {
    return NextResponse.json({
      account: {
        email: user.email || null,
        customer: null,
        subscriptions: subscriptionRows ?? [],
        paymentMethod: null,
        invoices: [],
        nextPaymentDue: null,
        periodSpend: 0,
        currency: "usd",
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const [customerResult, paymentMethods, invoices, subscriptions] = await Promise.all([
    stripe.customers.retrieve(customerId),
    stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 10 }),
    stripe.invoices.list({ customer: customerId, limit: 25 }),
    stripe.subscriptions.list({ customer: customerId, status: "all", limit: 25 }),
  ]);

  if (customerResult.deleted) {
    return NextResponse.json({ error: "Billing account is no longer available" }, { status: 409 });
  }

  const customer = customerResult;
  const defaultPaymentMethodId = typeof customer.invoice_settings.default_payment_method === "string"
    ? customer.invoice_settings.default_payment_method
    : customer.invoice_settings.default_payment_method?.id || null;
  const defaultMethod = paymentMethods.data.find((item) => item.id === defaultPaymentMethodId) ||
    paymentMethods.data[0] || null;

  const invoiceRows = invoices.data.map((invoice) => ({
    id: invoice.id,
    number: invoice.number || null,
    status: invoice.status || null,
    created: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
    dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    paidAt: invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
      : null,
    total: money(invoice.total, invoice.currency),
    amountPaid: money(invoice.amount_paid, invoice.currency),
    hostedInvoiceUrl: invoice.hosted_invoice_url || null,
    invoicePdf: invoice.invoice_pdf || null,
  }));

  const activeSubscriptions = subscriptions.data
    .filter((sub) => ["active", "trialing", "past_due"].includes(sub.status))
    .map((sub) => ({
      id: sub.id,
      status: sub.status,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      currentPeriodEnd: sub.items.data[0]?.current_period_end
        ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
        : null,
      items: sub.items.data.map((item) => ({
        priceId: item.price?.id || null,
        membership: membershipNameForPrice(item.price?.id),
        amount: money(item.price?.unit_amount, item.price?.currency),
        interval: item.price?.recurring?.interval || null,
        product: typeof item.price?.product === "string" ? item.price.product : item.price?.product?.id || null,
      })),
    }));

  const nextPaymentDue = activeSubscriptions
    .map((sub) => sub.currentPeriodEnd)
    .filter((value): value is string => Boolean(value))
    .sort()[0] || null;

  const now = new Date();
  const periodStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000;
  const periodSpend = invoices.data
    .filter((invoice) => invoice.created >= periodStart && invoice.status === "paid")
    .reduce((sum, invoice) => sum + Number(invoice.amount_paid || 0), 0);

  return NextResponse.json({
    account: {
      email: user.email || customer.email || null,
      customer: {
        id: customerId,
        name: customer.name || null,
        email: customer.email || user.email || null,
        phone: customer.phone || null,
        address: customer.address || null,
      },
      subscriptions: activeSubscriptions,
      paymentMethod: defaultMethod?.card ? {
        id: defaultMethod.id,
        brand: defaultMethod.card.brand || null,
        funding: defaultMethod.card.funding || null,
        last4: defaultMethod.card.last4 || null,
        expMonth: defaultMethod.card.exp_month || null,
        expYear: defaultMethod.card.exp_year || null,
      } : null,
      invoices: invoiceRows,
      nextPaymentDue,
      periodSpend,
      currency: invoices.data[0]?.currency || "usd",
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!stripe) return NextResponse.json({ error: "Billing processor is unavailable" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const { customerId } = await resolveStripeCustomer(user, { createIfMissing: true });
  if (!customerId) return NextResponse.json({ error: "Could not create billing account" }, { status: 500 });

  const name = cleanText((body as any).name, 120);
  const phone = cleanText((body as any).phone, 40);
  const addressInput = (body as any).address && typeof (body as any).address === "object" ? (body as any).address : {};
  const country = cleanText(addressInput.country, 2).toUpperCase();

  const customer = await stripe.customers.update(customerId, {
    name: name || undefined,
    phone: phone || undefined,
    address: {
      line1: cleanText(addressInput.line1, 160) || undefined,
      line2: cleanText(addressInput.line2, 160) || undefined,
      city: cleanText(addressInput.city, 100) || undefined,
      state: cleanText(addressInput.state, 100) || undefined,
      postal_code: cleanText(addressInput.postal_code, 32) || undefined,
      country: country || undefined,
    },
  });

  if (customer.deleted) return NextResponse.json({ error: "Billing account is unavailable" }, { status: 409 });

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name || null,
      email: customer.email || user.email || null,
      phone: customer.phone || null,
      address: customer.address || null,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
