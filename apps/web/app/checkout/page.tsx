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

type CheckoutArea = "build" | "3d-ai" | "publish";

function parseArea(raw: string | null): CheckoutArea {
  if (raw === "3d-ai" || raw === "publish") return raw;
  return "build";
}

const CHECKOUT_AREAS: Array<{
  id: CheckoutArea;
  name: string;
  description: string;
  bullets: string[];
}> = [
  {
    id: "build",
    name: "Build",
    description: "WonderBuild, files, AI-assisted editing and code tools.",
    bullets: ["Website/app building", "AI editing", "Files and code tools"],
  },
  {
    id: "3d-ai",
    name: "3D + AI",
    description: "WonderPlay, PlayCanvas, 3D generation and AI NPC creation.",
    bullets: ["3D scenes and assets", "AI NPC tools", "Generation and rendering"],
  },
  {
    id: "publish",
    name: "Publishing",
    description: "Production publishing, provider orchestration, domains and runtime management.",
    bullets: ["Production deploys", "Custom providers and domains", "Versions, rollback and runtime controls"],
  },
];

function CheckoutContent() {
  const searchParams = useSearchParams();

  const redirectTo = sanitizeRedirectPath(searchParams.get("redirectTo"));
  const planId = parsePlan(searchParams.get("plan"));
  const interval = parseInterval(searchParams.get("interval"));
  const area = parseArea(searchParams.get("area"));
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
      const back = `/checkout?plan=${encodeURIComponent(plan.id)}&interval=${interval}&area=${encodeURIComponent(area)}&redirectTo=${encodeURIComponent(redirectTo)}`;
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
        <p className="text-white/65">Review your selected plan and the product area you want to unlock.</p>

        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white/70">Subscription area</h2>
            <p className="mt-1 text-xs text-white/45">
              AI WONDERLAND billing is being split by product area so you only pay for the parts you use.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {CHECKOUT_AREAS.map((item) => {
              const active = area === item.id;
              const href = `/checkout?plan=${encodeURIComponent(plan.id)}&interval=${interval}&area=${encodeURIComponent(item.id)}&redirectTo=${encodeURIComponent(redirectTo)}`;
              return (
                <Link
                  key={item.id}
                  href={href}
                  className={`rounded-2xl border p-4 transition ${
                    active
                      ? "border-violet-400/70 bg-violet-500/10 shadow-[0_0_30px_rgba(139,92,246,.12)]"
                      : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-white">{item.name}</h3>
                    <span className={`h-3 w-3 rounded-full border ${
                      active ? "border-violet-300 bg-violet-400" : "border-white/30"
                    }`} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/55">{item.description}</p>
                  <ul className="mt-3 space-y-1 text-[11px] text-white/65">
                    {item.bullets.map((bullet) => <li key={bullet}>✓ {bullet}</li>)}
                  </ul>
                </Link>
              );
            })}
          </div>
        </section>

        {area === "publish" && (
          <section className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Publishing access</p>
                <h2 className="mt-1 text-lg font-bold text-white">Production publishing is the paid feature.</h2>
                <p className="mt-1 max-w-2xl text-sm text-white/55">
                  Export stays available separately. Secret-leak scanning and code security can be run at any time, and a fresh secret scan is required before a production publish.
                </p>
              </div>
              <Link href="/settings/security" className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/10">
                Security tools
              </Link>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-white/70 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">✓ Export project without publishing</div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">✓ Run secret scans any time</div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">✓ Run CodeQL when a supported GitHub repo is connected</div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">🔒 Production publish requires Publishing access</div>
            </div>
          </section>
        )}

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
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
