"use client";


import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useAuth } from "@lib/supabase/auth-context";

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

  const { user, session, loading: authLoading } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans: Plan[] = useMemo(
    () => [
      {
        id: "free",
        name: "The Nomad",
        price: "$0/forever",
        desc: "Every adventure begins somewhere. Wander in, no credit card required.",
        bullets: ["1 active project", "Basic Puck UI builder", "5 AI chats per day", "Community support", "dreammakerhub.website subdomain"],
        cta: "Start Wandering, It's Free",
        mode: "free",
        icon: "🌿",
        href: "/public-pages/auth",
      },
      {
        id: "pro",
        name: "The Architect",
        price: "$35/mo",
        desc: "For builders who are serious about shipping. Full creative power, one subscription.",
        bullets: ["5 active projects", "Unlimited AI chats", "Full 3D engine (PlayCanvas + WebGL Studio)", "WonderSpace Cloud IDE", "Egyptian Voice Module", "1-click deployment", "Custom domain included", "Accessibility tools for all creators", "Priority email support"],
        cta: "Become an Architect",
        mode: "paid",
        icon: "⭐",
        highlight: true,
      },
      {
        id: "team",
        name: "The Guild",
        price: "$149/mo",
        desc: "Built for agencies and studios who ship together. Collaborate, iterate, and deliver, without the chaos.",
        bullets: ["Everything in Pro", "Up to 5 team seats", "Shared asset library", "3 AI agent seats", "Collaborative IDE workspace", "Always-on runners (no hibernation)", "White-label ready", "300K Compute Credits/mo included"],
        cta: "Build With Your Guild",
        mode: "paid",
        icon: "🏢",
        href: "/checkout?plan=team",
      },
      {
        id: "enterprise",
        name: "The Architect of Worlds",
        price: "Custom",
        desc: "You're not building a site. You're building infrastructure. We'll build it with you.",
        bullets: ["Unlimited everything", "SSO + SCIM directory sync", "On-premise or private cloud deployment", "Custom AI agent training (your brand voice, your rules)", "Git-sync (GitHub / Bitbucket)", "Data isolation & multi-tenancy", "Accessibility compliance support (WCAG 2.1)", "Dedicated account manager", "SLA-backed uptime", "Custom Compute Credits package"],
        cta: "Talk to Us",
        mode: "paid",
        icon: "🌐",
        href: "/contact",
      },
    ],
    []
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

    // Use custom href if provided (for enterprise)
    if (plan.href) {
      router.push(plan.href);
      return;
    }

    const checkoutHref = `/checkout?plan=${encodeURIComponent(plan.id)}&redirectTo=${encodeURIComponent(redirectTo)}`;
    router.push(checkoutHref);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">Pricing</p>
          <h1 className="text-3xl font-bold text-white mb-3">Choose your path</h1>
          <p className="text-gray-400">Start free. Upgrade when you're ready to build without limits.</p>
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
                  <td className="py-3 px-4 text-gray-300">Puck UI Builder</td>
                  <td className="py-3 px-4 text-center text-gray-400">Basic</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-300">3D Engine (PlayCanvas)</td>
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
