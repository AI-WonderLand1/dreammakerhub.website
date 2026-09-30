import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { authenticatedSupabaseUser } from "@/lib/supabase/authenticated-user.server";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const money = (amount: number | null | undefined, currency: string | null | undefined) => ({
  amount: Number(amount ?? 0),
  currency: (currency || "usd").toLowerCase(),
});

export async function GET(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Billing data is unavailable" }, { status: 503 });

  const [{ data: profile }, { data: subscriptionRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("stripe_customer_id,subscription_tier")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("stripe_customer_id,stripe_subscription_id,plan,status,interval,price_id,cancel_at_period_end,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  const customerId = profile?.stripe_customer_id ||
    subscriptionRows?.find((row) => row.stripe_customer_id)?.stripe_customer_id ||
    null;

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

  const customer: any = customerResult;
  const defaultPaymentMethodId = typeof customer?.invoice_settings?.default_payment_method === "string"
    ? customer.invoice_settings.default_payment_method
    : customer?.invoice_settings?.default_payment_method?.id || null;
  const defaultMethod: any = paymentMethods.data.find((item) => item.id === defaultPaymentMethodId) ||
    paymentMethods.data[0] || null;

  const invoiceRows = invoices.data.map((invoice: any) => ({
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
    .filter((sub: any) => ["active", "trialing", "past_due"].includes(sub.status))
    .map((sub: any) => ({
      id: sub.id,
      status: sub.status,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      items: sub.items.data.map((item: any) => ({
        priceId: item.price?.id || null,
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
    .filter((invoice: any) => invoice.created >= periodStart && invoice.status === "paid")
    .reduce((sum: number, invoice: any) => sum + Number(invoice.amount_paid || 0), 0);

  return NextResponse.json({
    account: {
      email: user.email || customer?.email || null,
      customer: {
        id: customerId,
        name: customer?.name || null,
        email: customer?.email || user.email || null,
        phone: customer?.phone || null,
        address: customer?.address || null,
      },
      subscriptions: activeSubscriptions,
      paymentMethod: defaultMethod?.card ? {
        id: defaultMethod.id,
        brand: defaultMethod.card.brand || null,
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
