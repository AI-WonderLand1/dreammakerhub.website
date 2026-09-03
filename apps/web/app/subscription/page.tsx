"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import {
  Check, Sparkles, ChevronDown, ChevronUp,
  TrendingUp, ArrowRight, BarChart2, ShieldCheck
} from 'lucide-react';

import { PLANS } from "@/lib/billing/plans";
import { logger } from '@/lib/logger';
type Plan = {
  id: "free" | "pro" | "team" | "enterprise";
  name: string;
  price: string;
  desc: string;
  bullets?: string[];
  cta: string;
  mode: "free" | "paid";
  icon?: string;
  highlight?: boolean;
  href?: string;
  monthlyPrice: number;
};

const DEFAULT_REDIRECT = "/dashboard/projects";

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return DEFAULT_REDIRECT;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return DEFAULT_REDIRECT;
  if (trimmed.startsWith("//") || trimmed.includes("://")) return DEFAULT_REDIRECT;
  return trimmed;
}

const faqs = [
  {
    q: 'How does your billing measurement work? What is an "engine call"?',
    a: 'An engine call represents a single webhook callback, canvas-state compile, or visual layout generation API request processed on our rendering clusters. Front-end resizing operations do NOT count toward engine calls.'
  },
  {
    q: 'Can I change plans or cancel my subscription at any time?',
    a: 'Absolutely. You can upgrade, downgrade, or cancel directly from your Developer Dashboard. If you cancel, your access stays active until the end of the current billing cycle.'
  },
  {
    q: 'What happens if I exceed my monthly plan limits?',
    a: 'We never crash your apps! If you go over your limit, we send email warnings and let you purchase simple overage packs ($5 per 10,000 additional calls). If you frequently exceed limits, we recommend scaling into The Architect or The Guild plan.'
  },
  {
    q: 'Do you offer custom enterprise clusters or self-hosted options?',
    a: 'Yes, our Enterprise plan supports fully isolated AWS/GCP deployment clusters under virtual private clouds (VPC). Get in touch with our Sales team for customized pricing.'
  }
];

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirectPath(searchParams.get("redirectTo"));
  
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const successPlan = success ? searchParams.get("plan") : null;
  const successPlanName = successPlan && PLANS[successPlan as keyof typeof PLANS] ? PLANS[successPlan as keyof typeof PLANS].displayName : null;
  const [dismissBanner, setDismissBanner] = useState(false);

  useEffect(() => {
    if (success === "true") {
      const t = setTimeout(() => router.push(redirectTo), 2500);
      return () => clearTimeout(t);
    }
  }, [success, redirectTo, router]);

  const { user, session, loading: authLoading } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [roiScale, setRoiScale] = useState<number>(30000);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const isYearly = billingInterval === "year";

  const plans: Plan[] = useMemo(
    () =>
      (Object.values(PLANS)).map((p): Plan => ({
        id: p.id,
        name: p.name,
        price: isYearly && "yearlyPriceDisplay" in p ? (p as any).yearlyPriceDisplay : p.priceDisplay,
        desc: p.description,
        bullets: p.features,
        cta: p.id === "free" ? "Start Wandering, It's Free" : p.id === "enterprise" ? "Talk to Us" : `Subscribe to ${p.displayName}`,
        mode: p.price === 0 ? "free" : "paid",
        icon: p.id === "free" ? "🌿" : p.id === "pro" ? "⭐" : p.id === "team" ? "🏢" : "🌐",
        highlight: p.highlight ?? false,
        href: p.id === "free" ? "/public-pages/auth" : p.id === "enterprise" ? "/contact" : undefined,
        monthlyPrice: p.price / 100,
      })),
    [isYearly]
  );

  const suggestedPlan = useMemo(() => {
    if (roiScale <= 5000) return plans.find(p => p.id === "free")!;
    if (roiScale <= 100000) return plans.find(p => p.id === "pro")!;
    return plans.find(p => p.id === "team")!;
  }, [roiScale, plans]);

  const calculations = useMemo(() => {
    const alternativeProviderCost = Math.round((roiScale / 10000) * 12);
    const inHouseDevCost = Math.round((roiScale / 10000) * 35);
    const dreamMakerCost = suggestedPlan.id === "free" ? 0 : suggestedPlan.monthlyPrice;
    const moneySaved = Math.max(0, (alternativeProviderCost + inHouseDevCost) - dreamMakerCost);
    return { alternativeProviderCost, dreamMakerCost, moneySaved };
  }, [roiScale, suggestedPlan]);

  const requireAuthToken = () => {
    const token = session?.access_token;
    if (!token) {
      const back = `/subscription?redirectTo=${encodeURIComponent(redirectTo)}`;
      router.push(`/public-pages/auth?redirectTo=${encodeURIComponent(back)}`);
      return null;
    }
    return token;
  };

  const ensureFree = async () => {
    const token = requireAuthToken();
    if (!token) return;

    setLoadingPlan("free");
    try {
      const res = await fetch("/api/subscription/ensure", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to create free plan");
      }

      router.push(redirectTo);
    } catch (err) {
      logger.error(err);
      alert("Could not enable Free plan. Check console + API logs.");
      setLoadingPlan(null);
    }
  };

  const onSelect = async (plan: Plan) => {
    if (authLoading) return;

    if (!user) {
      const back = `/subscription?redirectTo=${encodeURIComponent(redirectTo)}`;
      router.push(`/public-pages/auth?redirectTo=${encodeURIComponent(back)}`);
      return;
    }

    if (plan.mode === "free") return ensureFree();

    if (plan.href) {
      router.push(plan.href);
      return;
    }

    const checkoutHref = `/checkout?plan=${encodeURIComponent(plan.id)}&interval=${billingInterval}&redirectTo=${encodeURIComponent(redirectTo)}`;
    router.push(checkoutHref);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 flex items-center justify-center px-4 py-12">
      <div className="max-w-6xl w-full">
        {(success === "true" && !dismissBanner) && (
          <div className="mb-6 p-4 rounded-xl bg-green-900/30 border border-green-500/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-green-400 text-xl">✓</span>
              <div>
                <p className="text-green-200 font-semibold">Subscription activated!</p>
                <p className="text-green-200/70 text-sm">Welcome to {successPlanName ?? "your"} plan.</p>
              </div>
            </div>
            <button onClick={() => setDismissBanner(true)} className="text-green-400 hover:text-green-300">✕</button>
          </div>
        )}
        
        {canceled === "true" && !dismissBanner && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-900/30 border border-yellow-500/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 text-xl">!</span>
              <div>
                <p className="text-yellow-200 font-semibold">Checkout canceled</p>
                <p className="text-yellow-200/70 text-sm">No worries, you can upgrade anytime.</p>
              </div>
            </div>
            <button onClick={() => setDismissBanner(true)} className="text-yellow-400 hover:text-yellow-300">✕</button>
          </div>
        )}
        
        {/* Heading */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase bg-violet-950/40 text-violet-300 border border-violet-500/30">
            Simple Transparent Pricing
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mt-3.5">Choose your path</h1>
          <p className="text-slate-400 text-sm mt-3">
            Start completely free in the sandbox, then scale up into dedicated visual clusters with advanced telemetry when you are ready to ship.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-xs font-semibold ${!isYearly ? 'text-white' : 'text-slate-400'}`}>Monthly Billing</span>
            <button 
              onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
              className="w-11 h-6 rounded-full relative transition-colors bg-zinc-800 border border-gray-700 p-0.5 focus:outline-none"
              aria-label="Toggle Billing Cycle"
            >
              <span className={`w-4.5 h-4.5 rounded-full transition-transform bg-white shadow block ${isYearly ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${isYearly ? 'text-white' : 'text-slate-400'}`}>
              Annual Billing
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded-full">Save ~17%</span>
            </span>
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="rounded-xl border border-gray-800 bg-zinc-900/30 p-5 md:p-6 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <BarChart2 className="w-4.5 h-4.5 text-violet-400" />
                    Scale Estimation Calculator
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Drag the slider to find the perfect plan fit for your traffic scale.</p>
                </div>
                <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-zinc-800 border border-gray-700 text-white">
                  {roiScale.toLocaleString()} calls / mo
                </span>
              </div>
              <input 
                type="range" 
                min={2000} 
                max={250000} 
                step={2000}
                value={roiScale}
                onChange={(e) => setRoiScale(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-violet-500"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <span>Indie (2k)</span>
                <span>Pro (100k)</span>
                <span>Scale (250k+)</span>
              </div>
            </div>
            <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-gray-800 pt-6 md:pt-0 md:pl-8 flex flex-col justify-between h-full gap-3">
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">Recommended Match:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white">{suggestedPlan.name.charAt(0).toUpperCase() + suggestedPlan.name.slice(1)}</span>
                  <span className="text-[10px] bg-emerald-950/50 text-emerald-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    Best Fit
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs text-slate-400">Estimate Price:</span>
                <span className="text-2xl font-black text-white font-sans">
                  ${suggestedPlan.monthlyPrice}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ month</span>
              </div>
              <div className="text-[11px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/60 rounded px-2 py-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>Save approx. <strong>${calculations.moneySaved.toLocaleString()} / mo</strong> compared to cloud server overhead.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-4 gap-4 items-stretch">
          {plans.map((p) => {
            const isLoading = loadingPlan === p.id;
            const isFree = p.id === "free";
            const isPro = p.id === "pro";
            const isTeam = p.id === "team";
            const isEnterprise = p.id === "enterprise";
            const isSuggested = suggestedPlan.id === p.id;

            return (
              <div
                key={p.id}
                className={`rounded-2xl border relative flex flex-col justify-between p-6 transition duration-300 ${
                  p.highlight
                    ? "bg-zinc-900/80 border-violet-500 shadow-lg shadow-violet-950/20 scale-[1.02] z-10"
                    : "bg-zinc-900/30 border-gray-800 hover:border-gray-700"
                } ${isSuggested ? 'ring-2 ring-emerald-500 ring-offset-4 ring-offset-[#050508]' : ''}`}
              >
                {p.highlight && (
                  <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-3.5 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1 bg-violet-600">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </span>
                )}

                {isSuggested && !p.highlight && (
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider uppercase bg-emerald-500 text-white shadow-sm">
                    Recommended Fit
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {p.icon && <span className="text-lg">{p.icon}</span>}
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${
                        isFree ? "text-white/30" : isPro ? "text-violet-400" : isTeam ? "text-blue-400" : "text-cyan-400"
                      }`}>
                        {isFree ? "Free" : isPro ? "Pro" : isTeam ? "Team" : "Enterprise"}
                      </p>
                    </div>
                    <h3 className="font-extrabold text-lg text-white">{p.name.charAt(0).toUpperCase() + p.name.slice(1)}</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed min-h-[36px]">{p.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1 pt-2 border-t border-zinc-900">
                    <span className="text-3xl md:text-4xl font-extrabold text-white font-sans">{p.price}</span>
                    {!isFree && !isEnterprise && (
                      <span className="text-xs text-slate-400 font-mono">/ mo</span>
                    )}
                  </div>

                  <button
                    onClick={() => onSelect(p)}
                    disabled={!!loadingPlan}
                    className={`w-full py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      p.highlight
                        ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                        : "border border-gray-800 text-slate-300 bg-transparent hover:bg-zinc-800"
                    }`}
                  >
                    <span>{isLoading ? "Processing..." : p.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <ul className="space-y-3 pt-6 mt-6 border-t border-zinc-900 text-xs flex-1">
                  {p.bullets?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isTeam ? "text-blue-400" : isEnterprise ? "text-cyan-400" : "text-violet-400"
                      }`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Back links */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <button className="text-slate-400 hover:text-white text-sm" onClick={() => router.push("/")}>
            ← Back to home
          </button>
          <button className="text-slate-400 hover:text-white text-sm" onClick={() => router.push(redirectTo)}>
            Continue without checkout →
          </button>
        </div>

        {/* Comparison Table */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-2">Compare Plans</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Choose the plan that fits your stage</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Feature</th>
                  <th className="py-3 px-4 text-center text-white/60 font-semibold">Nomad</th>
                  <th className="py-3 px-4 text-center text-violet-400 font-semibold">Architect</th>
                  <th className="py-3 px-4 text-center text-blue-400 font-semibold">Guild</th>
                  <th className="py-3 px-4 text-center text-cyan-400 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-3 px-4 text-slate-300">Active Projects</td>
                  <td className="py-3 px-4 text-center text-slate-400">1</td>
                  <td className="py-3 px-4 text-center text-white">5</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">AI Chats</td>
                  <td className="py-3 px-4 text-center text-slate-400">5/day</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Wonderbuild UI Editor</td>
                  <td className="py-3 px-4 text-center text-slate-400">Basic</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Wonderplay 3D Engine</td>
                  <td className="py-3 px-4 text-center text-slate-500">—</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">WonderSpace IDE</td>
                  <td className="py-3 px-4 text-center text-slate-500">—</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Custom Domain</td>
                  <td className="py-3 px-4 text-center text-slate-500">—</td>
                  <td className="py-3 px-4 text-center text-white">1</td>
                  <td className="py-3 px-4 text-center text-white">Multiple</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Team Seats</td>
                  <td className="py-3 px-4 text-center text-slate-400">1</td>
                  <td className="py-3 px-4 text-center text-slate-400">1</td>
                  <td className="py-3 px-4 text-center text-white">5</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Priority GPU</td>
                  <td className="py-3 px-4 text-center text-slate-500">—</td>
                  <td className="py-3 px-4 text-center text-slate-500">—</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">White-Labeling</td>
                  <td className="py-3 px-4 text-center text-slate-500">—</td>
                  <td className="py-3 px-4 text-center text-slate-500">—</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">SSO / SCIM</td>
                  <td className="py-3 px-4 text-center text-slate-500">—</td>
                  <td className="py-3 px-4 text-center text-slate-500">—</td>
                  <td className="py-3 px-4 text-center text-slate-500">—</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Compute Credits</td>
                  <td className="py-3 px-4 text-center text-slate-500">—</td>
                  <td className="py-3 px-4 text-center text-slate-500">—</td>
                  <td className="py-3 px-4 text-center text-white">300K/mo</td>
                  <td className="py-3 px-4 text-center text-white">Custom</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="py-3 px-4 text-slate-300">Support</td>
                  <td className="py-3 px-4 text-center text-slate-400">Community</td>
                  <td className="py-3 px-4 text-center text-white">Priority</td>
                  <td className="py-3 px-4 text-center text-white">Dedicated</td>
                  <td className="py-3 px-4 text-center text-white">SLA + Manager</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 pt-10 border-t border-gray-800 max-w-3xl mx-auto">
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-white text-center mb-6">
            Frequently Asked Questions
          </h3>
          <div className="divide-y divide-gray-800 border-b border-gray-800">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-4">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left font-bold text-sm md:text-base text-white flex items-center justify-between py-1 hover:text-violet-300 transition"
                >
                  <span className="pr-6">{faq.q}</span>
                  {activeFaq === idx ? <ChevronUp className="w-4 h-4 shrink-0 text-violet-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
                </button>
                {activeFaq === idx && (
                  <p className="text-xs md:text-sm text-slate-400 mt-2 pl-0.5 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionContent />
    </Suspense>
  );
}
