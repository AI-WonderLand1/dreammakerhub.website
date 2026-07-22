"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { PLANS, type PlanId } from "@/lib/billing/plans";

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/8x2dR8cmZ54dbWlfky8so00";

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

function CheckoutContent() {
  const searchParams = useSearchParams();

  const redirectTo = sanitizeRedirectPath(searchParams.get("redirectTo"));
  const planId = parsePlan(searchParams.get("plan"));

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
            <p className="text-2xl font-extrabold">{plan.priceDisplay}</p>
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
            <Link href="/(public)/terms" className="text-purple-300 hover:underline">Terms of Service</Link>
            ,{' '}
            <Link href="/(public)/privacy" className="text-purple-300 hover:underline">Privacy Policy</Link>
            , and{' '}
            <Link href="/(public)/refund" className="text-purple-300 hover:underline">Refund & Return Policy</Link>
            .
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={STRIPE_PAYMENT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Subscribe to {plan.name}
            </a>

            <Link
              href={`/subscription?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="inline-block rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10"
            >
              Change plan
            </Link>
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
