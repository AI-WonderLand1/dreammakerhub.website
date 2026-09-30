"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, ExternalLink, ReceiptText, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Money = { amount: number; currency: string };

type BillingAccount = {
  email: string | null;
  customer: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    address: {
      line1?: string | null;
      line2?: string | null;
      city?: string | null;
      state?: string | null;
      postal_code?: string | null;
      country?: string | null;
    } | null;
  } | null;
  subscriptions: Array<{
    id: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    items: Array<{
      priceId: string | null;
      amount: Money;
      interval: string | null;
      product: string | null;
    }>;
  }>;
  paymentMethod: {
    id: string;
    brand: string | null;
    last4: string | null;
    expMonth: number | null;
    expYear: number | null;
  } | null;
  invoices: Array<{
    id: string;
    number: string | null;
    status: string | null;
    created: string | null;
    dueDate: string | null;
    paidAt: string | null;
    total: Money;
    amountPaid: Money;
    hostedInvoiceUrl: string | null;
    invoicePdf: string | null;
  }>;
  nextPaymentDue: string | null;
  periodSpend: number;
  currency: string;
};

function formatMoney(value: Money | { amount: number; currency: string }) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: (value.currency || "usd").toUpperCase(),
  }).format(value.amount / 100);
}

function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Authentication is unavailable.");
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        credentials: "same-origin",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.url) throw new Error(payload?.error || "Could not open billing portal.");
      window.location.assign(payload.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open billing portal.");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void openPortal()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-50"
      >
        <ExternalLink size={14} />
        {loading ? "Opening…" : "Manage in Stripe"}
      </button>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}

export function BillingCenterSidebar() {
  const pathname = usePathname();
  const items = [
    ["/dashboard/usage", "Overview"],
    ["/dashboard/usage/metered", "Usage"],
    ["/dashboard/usage/ai", "AI usage"],
    ["/dashboard/usage/alerts", "Budgets & alerts"],
    ["/dashboard/usage/licensing", "Licensing"],
    ["/dashboard/usage/payment-information", "Payment information"],
    ["/dashboard/usage/payment-history", "Payment history"],
    ["/dashboard/usage/additional-details", "Additional billing details"],
  ] as const;

  return (
    <aside className="h-fit rounded-xl border border-white/10 bg-[#08111c] p-3 lg:sticky lg:top-24">
      <div className="mb-3 flex items-center gap-2 px-2 text-sm font-semibold text-white">
        <CreditCard size={16} />
        Billing and licensing
      </div>
      <nav className="space-y-1" aria-label="Billing sections">
        {items.map(([href, label]) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                active ? "bg-white/10 font-semibold text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function BillingAccountSections({ section = "overview" }: { section?: "overview" | "payment-information" | "payment-history" | "additional-details" }) {
  const [account, setAccount] = useState<BillingAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Authentication is unavailable.");
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/billing/account", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.account) throw new Error(payload?.error || "Could not load billing account.");
      setAccount(payload.account);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load billing account.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) {
    return <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">Loading billing account…</div>;
  }

  const customer = account?.customer;
  const address = customer?.address;
  const method = account?.paymentMethod;

  return (
    <>
      {section === "overview" && <section className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Overview</h2>
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white">
            <RefreshCw size={13} /> Refresh billing
          </button>
        </div>
        {error && <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/15 bg-white/[.025] p-4">
            <div className="text-sm font-semibold text-white/80">Current billed this month</div>
            <div className="mt-3 text-3xl font-semibold">
              {formatMoney({ amount: account?.periodSpend ?? 0, currency: account?.currency ?? "usd" })}
            </div>
            <p className="mt-2 text-xs text-white/45">Paid DreamMakerHub invoices in the current calendar month.</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/[.025] p-4">
            <div className="text-sm font-semibold text-white/80">Active subscriptions</div>
            <div className="mt-3 text-3xl font-semibold">{account?.subscriptions.length ?? 0}</div>
            <p className="mt-2 text-xs text-white/45">From this user's Stripe customer only.</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/[.025] p-4">
            <div className="text-sm font-semibold text-white/80">Next payment due</div>
            <div className="mt-3 text-2xl font-semibold">
              {account?.nextPaymentDue ? new Date(account.nextPaymentDue).toLocaleDateString() : "—"}
            </div>
            <p className="mt-2 text-xs text-white/45">Based on the current Stripe subscription period.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Subscriptions</h3>
            <p className="text-xs text-white/45">Only subscriptions owned by the signed-in billing customer are shown.</p>
          </div>
          <BillingPortalButton />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {(account?.subscriptions ?? []).map((subscription) => {
            const item = subscription.items[0];
            return (
              <div key={subscription.id} className="rounded-xl border border-white/15 bg-white/[.025] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold capitalize">{subscription.status}</div>
                  <span className="text-xs text-white/45">{subscription.cancelAtPeriodEnd ? "Cancels at period end" : "Renews"}</span>
                </div>
                {item && (
                  <div className="mt-3 text-xl">
                    {formatMoney(item.amount)}
                    <span className="text-sm text-white/45">{item.interval ? ` / ${item.interval}` : ""}</span>
                  </div>
                )}
              </div>
            );
          })}
          {(account?.subscriptions ?? []).length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[.025] p-4 text-sm text-white/45">
              No paid Stripe subscription is attached to this account.
            </div>
          )}
        </div>
      </section>}

      {section === "payment-information" && <section className="mb-6 rounded-xl border border-white/10 bg-white/[.025] p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Payment information</h2>
            <p className="mt-1 text-sm text-white/45">Safe billing summary for the signed-in user's Stripe customer.</p>
          </div>
          <BillingPortalButton />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 p-4">
            <div className="text-sm font-semibold">Billing information</div>
            <div className="mt-2 space-y-1 text-sm text-white/60">
              <div>{customer?.name || account?.email || "No billing name on file"}</div>
              {address?.line1 && <div>{address.line1}</div>}
              {address?.line2 && <div>{address.line2}</div>}
              {(address?.city || address?.state || address?.postal_code) && (
                <div>{[address.city, address.state, address.postal_code].filter(Boolean).join(", ")}</div>
              )}
              {address?.country && <div>{address.country}</div>}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 p-4">
            <div className="text-sm font-semibold">Payment method</div>
            {method ? (
              <div className="mt-2 text-sm text-white/60">
                <div className="capitalize">{method.brand} ending in {method.last4}</div>
                <div>Expires {String(method.expMonth ?? "").padStart(2, "0")}/{method.expYear}</div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-white/45">No saved card returned by Stripe.</div>
            )}
          </div>
        </div>
      </section>}

      {section === "payment-history" && <section className="mb-6 rounded-xl border border-white/10 bg-white/[.025] p-4">
        <div className="flex items-center gap-2">
          <ReceiptText size={17} />
          <h2 className="text-lg font-semibold">Payment history</h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/45">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Invoice</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 text-right">Receipt / invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(account?.invoices ?? []).map((invoice) => (
                <tr key={invoice.id}>
                  <td className="py-3 pr-3">{invoice.created ? new Date(invoice.created).toLocaleDateString() : "—"}</td>
                  <td className="py-3 pr-3 font-mono text-xs">{invoice.number || invoice.id}</td>
                  <td className="py-3 pr-3">{formatMoney(invoice.total)}</td>
                  <td className="py-3 pr-3 capitalize">{invoice.status || "unknown"}</td>
                  <td className="py-3 text-right">
                    <div className="inline-flex gap-3">
                      {invoice.hostedInvoiceUrl && (
                        <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">View</a>
                      )}
                      {invoice.invoicePdf && (
                        <a href={invoice.invoicePdf} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">PDF</a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(account?.invoices ?? []).length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-white/40">No Stripe invoice history for this user.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>}

      {section === "additional-details" && <section className="mb-6 rounded-xl border border-white/10 bg-white/[.025] p-4">
        <h2 className="text-lg font-semibold">Additional billing details</h2>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-lg border border-white/10 p-3">
            <div className="text-white/45">Billing email</div>
            <div className="mt-1">{customer?.email || account?.email || "Not available"}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <div className="text-white/45">Stripe customer</div>
            <div className="mt-1 font-mono text-xs">{customer?.id ? `••••${customer.id.slice(-8)}` : "Not created yet"}</div>
          </div>
        </div>
      </section>}
    </>
  );
}
