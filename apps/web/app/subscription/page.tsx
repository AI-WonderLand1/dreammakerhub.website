"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Info, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { PLAN_LIMITS, formatBytes, formatNumber } from "@/lib/billing/limits";
import { logger } from "@/lib/logger";

const DEFAULT_REDIRECT = "/dashboard/projects";

type PricingStatus = {
  monthlyConfigured?: boolean;
  yearlyConfigured?: boolean;
};

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return DEFAULT_REDIRECT;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://") || /[\\\r\n\t]/.test(trimmed)) {
    return DEFAULT_REDIRECT;
  }
  return trimmed;
}

const planOrder: PlanId[] = ["free", "creator", "pro", "studio", "team", "enterprise"];
const planIcons: Record<PlanId, string> = {
  free: "🌿",
  creator: "🎨",
  pro: "⭐",
  studio: "🎬",
  team: "🏢",
  enterprise: "🌐",
};

const faqs = [
  {
    q: "What are AI credits?",
    a: "AI credits are AI WONDERLAND's normalized usage unit across supported model providers. AI Playground can still show the selected model and provider. Higher-cost model classes consume credits faster than standard models.",
  },
  {
    q: "Are 3D credits the same as AI credits?",
    a: "No. 3D generation and rendering use a separate 3D credit balance so GPU-heavy work does not silently drain the normal AI balance.",
  },
  {
    q: "Can I buy more usage without upgrading?",
    a: "Yes. AI credit packs and 3D credit packs are separate one-time purchases. Your membership controls included monthly allowances and product entitlements.",
  },
  {
    q: "Can I choose Fast, Balanced or Advanced AI in every builder?",
    a: "Not yet. Builders currently use their configured default AI route. Fast, Balanced and Advanced are planned future choices and are not advertised as live controls.",
  },
  {
    q: "Is WonderSpace cloud IDE access guaranteed by a plan?",
    a: "No. Customer WonderSpace provisioning is currently a controlled beta and remains behind safety and isolation gates. The pricing page does not promise immediate workspace creation.",
  },
];

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirectPath(searchParams.get("redirectTo"));
  const canceled = searchParams.get("canceled") === "true";
  const returned = searchParams.get("success") === "true";
  const { session, loading: authLoading } = useAuth();

  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [freeError, setFreeError] = useState("");
  const [pricing, setPricing] = useState<Record<string, PricingStatus>>({});

  useEffect(() => {
    let active = true;
    fetch("/api/subscription/pricing", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Pricing status unavailable")))
      .then((payload) => {
        if (active && payload?.plans) setPricing(payload.plans);
      })
      .catch((error) => logger.warn("Pricing readiness lookup failed", error));
    return () => { active = false; };
  }, []);

  const plans = useMemo(() => planOrder.map((id) => PLANS[id]), []);
  const isYearly = billingInterval === "year";

  const ensureFree = async () => {
    if (authLoading || loadingPlan) return;
    const token = session?.access_token;
    if (!token) {
      const back = `/subscription?redirectTo=${encodeURIComponent(redirectTo)}`;
      router.push(`/public-pages/auth?redirectTo=${encodeURIComponent(back)}`);
      return;
    }

    setFreeError("");
    setLoadingPlan("free");
    try {
      const response = await fetch("/api/subscription/ensure", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Could not enable the free plan");
      router.push(redirectTo);
    } catch (error) {
      logger.error("Free subscription setup failed", error);
      setFreeError(error instanceof Error ? error.message : "Could not enable the free plan");
    } finally {
      setLoadingPlan(null);
    }
  };

  const checkoutReady = (id: PlanId) => {
    if (id === "free" || id === "enterprise") return true;
    const status = pricing[id];
    return isYearly ? Boolean(status?.yearlyConfigured) : Boolean(status?.monthlyConfigured);
  };

  const onSelect = (id: PlanId) => {
    if (id === "enterprise") {
      router.push("/contact");
      return;
    }
    if (id === "free") {
      void ensureFree();
      return;
    }
    if (!checkoutReady(id)) return;
    router.push(`/checkout?plan=${encodeURIComponent(id)}&interval=${billingInterval}&redirectTo=${encodeURIComponent(redirectTo)}`);
  };

  return (
    <main className="min-h-screen bg-[#050508] px-4 py-12 text-slate-200">
      <div className="mx-auto max-w-7xl">
        {returned && (
          <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-100">
            Returning from Checkout does not activate a plan by itself. AI WONDERLAND waits for a verified Stripe subscription event.
          </div>
        )}
        {canceled && (
          <div className="mb-6 rounded-xl border border-yellow-500/40 bg-yellow-950/30 p-4 text-sm text-yellow-100">
            Checkout was canceled. No plan change was applied.
          </div>
        )}

        <header className="mx-auto max-w-3xl text-center">
          <span className="rounded-full border border-violet-500/30 bg-violet-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-300">
            AI WONDERLAND Memberships
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">Six plans. One platform.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-400 md:text-base">
            Your membership includes monthly AI and 3D allowances. Buy extra AI or 3D credits when needed without changing plans.
          </p>
          <div className="mt-7 inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button onClick={() => setBillingInterval("month")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${!isYearly ? "bg-white text-black" : "text-slate-400"}`}>Monthly</button>
            <button onClick={() => setBillingInterval("year")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${isYearly ? "bg-white text-black" : "text-slate-400"}`}>Yearly · save about 17%</button>
          </div>
        </header>

        <section className="mt-10 rounded-2xl border border-cyan-500/20 bg-cyan-950/15 p-5">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
            <div className="text-sm leading-6 text-cyan-50/80">
              <strong className="text-white">How usage works:</strong> AI Playground may show the exact model/provider. Standard, enhanced, premium and frontier model classes consume progressively more AI credits. 3D generation uses a separate 3D balance. BYOK provider usage does not consume platform model credits, though platform request limits and safety controls can still apply.
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const ready = checkoutReady(plan.id);
            const loading = loadingPlan === plan.id;
            const price = isYearly ? plan.yearlyPriceDisplay : plan.priceDisplay;
            const paid = plan.id !== "free" && plan.id !== "enterprise";
            return (
              <article key={plan.id} className={`relative flex flex-col rounded-2xl border p-6 ${plan.highlight ? "border-violet-500 bg-violet-950/20 shadow-xl shadow-violet-950/20" : "border-white/10 bg-white/[.03]"}`}>
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                    Most popular
                  </span>
                )}
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                  <span className="text-xl">{planIcons[plan.id]}</span>
                  {plan.displayName}
                </div>
                <div className="mt-4 text-3xl font-black text-white">{price}</div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{plan.description}</p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /><span>{feature}</span></li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => onSelect(plan.id)}
                  disabled={Boolean(loadingPlan) || (paid && !ready) || (plan.id === "free" && authLoading)}
                  className={`mt-7 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${plan.highlight ? "bg-violet-600 text-white hover:bg-violet-500" : "border border-white/15 bg-white/5 text-white hover:bg-white/10"} disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  {loading ? "Processing…" : plan.id === "free" ? "Start free" : plan.id === "enterprise" ? "Contact sales" : ready ? `Choose ${plan.displayName}` : "Checkout setup pending"}
                  <ArrowRight className="h-4 w-4" />
                </button>
                {paid && !ready && (
                  <p className="mt-2 text-center text-[11px] leading-4 text-amber-300/80">
                    This price is part of the new catalog, but live Stripe Checkout is not enabled for this interval yet.
                  </p>
                )}
                {plan.id === "free" && freeError && <p className="mt-2 text-xs text-red-300">{freeError}</p>}
              </article>
            );
          })}
        </section>

        <section className="mt-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-2xl font-black text-white">Included monthly usage</h2>
            <p className="mt-1 text-sm text-slate-400">These are plan allowances, not promises that every beta feature is enabled for every account.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="border-b border-white/10 bg-white/[.025]">
                <tr>
                  <th className="px-4 py-4 text-left text-slate-400">Allowance</th>
                  {plans.map((plan) => <th key={plan.id} className="px-4 py-4 text-center text-white">{plan.displayName}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ["AI credits", ...planOrder.map((id) => id === "enterprise" ? "Custom" : formatNumber(PLAN_LIMITS[id].aiTokensMonthly))],
                  ["3D credits", ...planOrder.map((id) => id === "enterprise" ? "Custom" : formatNumber(PLAN_LIMITS[id].renderCreditsMonthly))],
                  ["Projects", ...planOrder.map((id) => id === "enterprise" ? "Custom" : PLAN_LIMITS[id].projectsLimit >= 999999 ? "Large pooled" : formatNumber(PLAN_LIMITS[id].projectsLimit))],
                  ["Storage", ...planOrder.map((id) => id === "enterprise" ? "Custom" : formatBytes(PLAN_LIMITS[id].storageLimit))],
                  ["Extra AI credits", "Available", "Available", "Available", "Available", "Available", "Contract"],
                  ["Extra 3D credits", "Available", "Available", "Available", "Available", "Available", "Contract"],
                  ["WonderSpace cloud IDE", "Controlled beta", "Controlled beta", "Controlled beta", "Controlled beta", "Controlled beta", "By agreement"],
                ].map((row) => (
                  <tr key={String(row[0])}>
                    <th className="px-4 py-4 text-left font-semibold text-slate-300">{row[0]}</th>
                    {row.slice(1).map((value, index) => <td key={`${row[0]}-${index}`} className="px-4 py-4 text-center text-slate-400">{value}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-950/15 p-6">
            <Sparkles className="h-6 w-6 text-violet-300" />
            <h2 className="mt-3 text-xl font-black text-white">AI Playground stays transparent</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              AI Playground can show the exact enabled model and provider plus its relative AI-credit class. Customers can compare models without needing separate subscriptions for every provider.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-950/15 p-6">
            <Sparkles className="h-6 w-6 text-blue-300" />
            <h2 className="mt-3 text-xl font-black text-white">Builder AI modes are planned</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Fast, Balanced and Advanced are the planned three choices for builders. They are not live selectors yet; current builders continue using their configured default AI route.
            </p>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-center text-2xl font-black text-white">Billing FAQ</h2>
          <div className="mx-auto mt-7 max-w-4xl divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[.025]">
            {faqs.map((item) => (
              <details key={item.q} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold text-white">{item.q}</summary>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-12 flex justify-center">
          <button className="text-sm text-slate-400 hover:text-white" onClick={() => router.push(redirectTo)}>Continue to AI WONDERLAND without checkout →</button>
        </div>
      </div>
    </main>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508] p-12 text-white">Loading plans…</div>}>
      <SubscriptionContent />
    </Suspense>
  );
}
