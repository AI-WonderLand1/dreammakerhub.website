"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { useAuth } from "@/lib/supabase/auth-context";

import { PLANS, type PlanId } from "@/lib/billing/plans";


const DEFAULT_REDIRECT = "/dashboard/projects";

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return DEFAULT_REDIRECT;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return DEFAULT_REDIRECT;
  if (trimmed.startsWith("//") || trimmed.includes("://")) return DEFAULT_REDIRECT;
  return trimmed;
}

function parsePlan(raw: string | null): PlanId | null {
  if (!raw) return null;
  const plan = PLANS[raw as PlanId];
  if (!plan || plan.price === 0 || raw === "enterprise") return null;
  return raw as PlanId;
}

function parseInterval(raw: string | null): "month" | "year" {
  return raw === "year" ? "year" : "month";
}

function CheckoutContent() {
  const searchParams = useSearchParams();

  const redirectTo = sanitizeRedirectPath(searchParams.get("redirectTo"));
  const planId = parsePlan(searchParams.get("plan"));
  const interval = parseInterval(searchParams.get("interval"));
  const { user, session, loading: authLoading } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const plan = useMemo(() => (planId ? PLANS[planId] : null), [planId]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="max-w-lg w-full rounded-2xl border border-red-500/40 bg-red-950/20 p-8 text-center">
          <h1 className="text-2xl font-bold mb-3">Invalid checkout plan</h1>
          <p className="text-red-200/80 mb-6">Select a plan from the subscription page to continue.</p>
          <Link href="/subscription" className="inline-block rounded-xl bg-white/10 px-5 py-2.5 hover:bg-white/20">
            Go to subscription
          </Link>
        </div>
      </div>
    );
  }

  const startCheckout = async () => {
    if (authLoading || checkoutLoading) return;

    if (!user || !session?.access_token) {
      const back = `/checkout?plan=${encodeURIComponent(plan.id)}&interval=${interval}&redirectTo=${encodeURIComponent(redirectTo)}`;
      window.location.href = `/public-pages/auth?redirectTo=${encodeURIComponent(back)}`;
      return;
    }

    setCheckoutError("");
    setCheckoutLoading(true);

    try {
      const response = await fetch("/api/subscription/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan: plan.id,
          interval,
          redirectTo,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Unable to start checkout");
      }

      window.location.assign(data.url);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to start checkout");
      setCheckoutLoading(false);
    }
  };

  const displayPrice = interval === "year" ? plan.yearlyPriceDisplay : plan.priceDisplay;

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-purple-400 mb-2">Checkout</p>
        <h1 className="text-3xl font-bold mb-2">Confirm your subscription</h1>
        <p className="text-white/65">Review your selected plan, then complete checkout.</p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="text-white/70 mt-1">Cancel any time.</p>
            </div>
            <p className="text-2xl font-extrabold">{displayPrice}</p>
          </div>

          <ul className="mt-5 space-y-2 text-sm text-white/80">
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-2">
                <span className="text-green-400">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 text-xs text-white/60">
            By subscribing, you agree to our{' '}
            <Link href="/terms" className="text-purple-300 hover:underline">Terms of Service</Link>
            ,{' '}
            <Link href="/privacy" className="text-purple-300 hover:underline">Privacy Policy</Link>
            , and{' '}
            <Link href="/refund" className="text-purple-300 hover:underline">Refund & Return Policy</Link>
            .
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startCheckout}
              disabled={authLoading || checkoutLoading}
              className="inline-block rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkoutLoading ? "Opening secure checkout..." : `Subscribe to ${plan.name}`}
            </button>

            <Link
              href={`/subscription?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="inline-block rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10"
            >
              Change plan
            </Link>
          {checkoutError && (
            <p className="w-full text-sm text-red-300" role="alert">
              {checkoutError}
            </p>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
