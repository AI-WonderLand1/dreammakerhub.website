"use client";


import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useAuth } from "@lib/supabase/auth-context";
import { PLANS, type PlanId } from "@lib/billing/plans";

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
};

const DEFAULT_REDIRECT = "/dashboard/projects";

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return DEFAULT_REDIRECT;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return DEFAULT_REDIRECT;
  if (trimmed.startsWith("//") || trimmed.includes("://")) return DEFAULT_REDIRECT;
  return trimmed;
}

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirectPath(searchParams.get("redirectTo"));
  
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const [dismissBanner, setDismissBanner] = useState(false);

  const { user, session, loading: authLoading } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
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
      })),
    [isYearly]
  );

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
      console.error(err);
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
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-5xl w-full">
        {(success === "true" && !dismissBanner) && (
          <div className="mb-6 p-4 rounded-xl bg-green-900/30 border border-green-500/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-green-400 text-xl">✓</span>
              <div>
                <p className="text-green-200 font-semibold">Subscription activated!</p>
                <p className="text-green-200/70 text-sm">Welcome to The Architect plan.</p>
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
        
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">Pricing</p>
          <h1 className="text-3xl font-bold text-white mb-3">Choose your path</h1>
          <p className="text-gray-400">Start free. Upgrade when you're ready to build without limits.</p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setBillingInterval("month")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                !isYearly ? "bg-purple-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("year")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                isYearly ? "bg-purple-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              Yearly <span className="text-green-400 text-xs ml-1">Save ~17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isLoading = loadingPlan === p.id;
            const isPro = p.id === "pro";
            const isTeam = p.id === "team";
            const isEnterprise = p.id === "enterprise";

            return (
              <div
                key={p.id}
                className={[
                  "relative rounded-2xl p-6 border text-left flex flex-col",
                  isPro
                    ? "bg-gradient-to-b from-purple-950/50 to-gray-950 border-purple-500/50 shadow-xl shadow-purple-900/20"
                    : isTeam
                      ? "bg-gradient-to-b from-blue-950/30 to-gray-950 border-blue-500/30"
                      : isEnterprise
                        ? "bg-gradient-to-b from-cyan-950/30 to-gray-950 border-cyan-500/30"
                        : "bg-gray-900 border-gray-800",
                ].join(" ")}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap">
                    MOST POPULAR
                  </span>
                )}

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    {p.icon && <span className="text-lg">{p.icon}</span>}
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                      isPro ? "text-purple-400" : isTeam ? "text-blue-400" : isEnterprise ? "text-cyan-400" : "text-white/30"
                    }`}>
                      {p.id === "free" ? "Free" : p.id === "pro" ? "Pro" : p.id === "team" ? "Team" : "Enterprise"}
                    </p>
                  </div>
                  <div className="text-xl font-bold text-white">{p.name}</div>
                  <div className="text-3xl font-extrabold text-white mt-1">{p.price}</div>
                </div>

                <div className="text-sm text-gray-400 mb-4">{p.desc}</div>

                {p.bullets?.length ? (
                  <ul className="text-sm space-y-2 mb-6 flex-1">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex gap-2 text-gray-300">
                        <span className={`shrink-0 ${
                          isTeam ? "text-blue-400" : isEnterprise ? "text-cyan-400" : "text-green-400"
                        }`}>✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <button
                  onClick={() => onSelect(p)}
                  disabled={!!loadingPlan}
                  className={[
                    "w-full py-3 rounded-xl font-semibold transition disabled:opacity-50 text-sm",
                    isPro
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/20"
                      : isTeam
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 hover:shadow-lg hover:shadow-blue-500/20"
                        : isEnterprise
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 hover:shadow-lg hover:shadow-cyan-500/20"
                          : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90",
                  ].join(" ")}
                >
                  {isLoading ? "Processing..." : p.cta}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <button className="text-gray-400 hover:text-white" onClick={() => router.push("/")}>
            ← Back to home
          </button>

          <button className="text-gray-400 hover:text-white" onClick={() => router.push(redirectTo)}>
            Continue without checkout → {redirectTo}
          </button>
        </div>

        {/* ─── COMPARISON TABLE ──────────────────────────────────────────────── */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">Compare Plans</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Choose the plan that fits your stage</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Feature</th>
                  <th className="py-3 px-4 text-center text-white/60 font-semibold">Nomad</th>
                  <th className="py-3 px-4 text-center text-purple-400 font-semibold">Architect</th>
                  <th className="py-3 px-4 text-center text-blue-400 font-semibold">Guild</th>
                  <th className="py-3 px-4 text-center text-cyan-400 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-3 px-4 text-gray-300">Active Projects</td>
                  <td className="py-3 px-4 text-center text-gray-400">1</td>
                  <td className="py-3 px-4 text-center text-white">5</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-300">AI Chats</td>
                  <td className="py-3 px-4 text-center text-gray-400">5/day</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-300">Wonderbuild UI Editor</td>
                  <td className="py-3 px-4 text-center text-gray-400">Basic</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-300">Wonderplay 3D Engine</td>
                  <td className="py-3 px-4 text-center text-gray-500">—</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-300">WonderSpace IDE</td>
                  <td className="py-3 px-4 text-center text-gray-500">—</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-300">Custom Domain</td>
                  <td className="py-3 px-4 text-center text-gray-500">—</td>
                  <td className="py-3 px-4 text-center text-white">1</td>
                  <td className="py-3 px-4 text-center text-white">Multiple</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-300">Team Seats</td>
                  <td className="py-3 px-4 text-center text-gray-400">1</td>
                  <td className="py-3 px-4 text-center text-gray-400">1</td>
                  <td className="py-3 px-4 text-center text-white">5</td>
                  <td className="py-3 px-4 text-center text-white">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-300">Priority GPU</td>
                  <td className="py-3 px-4 text-center text-gray-500">—</td>
                  <td className="py-3 px-4 text-center text-gray-500">—</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-300">White-Labeling</td>
                  <td className="py-3 px-4 text-center text-gray-500">—</td>
                  <td className="py-3 px-4 text-center text-gray-500">—</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-300">SSO / SCIM</td>
                  <td className="py-3 px-4 text-center text-gray-500">—</td>
                  <td className="py-3 px-4 text-center text-gray-500">—</td>
                  <td className="py-3 px-4 text-center text-gray-500">—</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-300">Compute Credits</td>
                  <td className="py-3 px-4 text-center text-gray-500">—</td>
                  <td className="py-3 px-4 text-center text-gray-500">—</td>
                  <td className="py-3 px-4 text-center text-white">300K/mo</td>
                  <td className="py-3 px-4 text-center text-white">Custom</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="py-3 px-4 text-gray-300">Support</td>
                  <td className="py-3 px-4 text-center text-gray-400">Community</td>
                  <td className="py-3 px-4 text-center text-white">Priority</td>
                  <td className="py-3 px-4 text-center text-white">Dedicated</td>
                  <td className="py-3 px-4 text-center text-white">SLA + Manager</td>
                </tr>
              </tbody>
            </table>
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
