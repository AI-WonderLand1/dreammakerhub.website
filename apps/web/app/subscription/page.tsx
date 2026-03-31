"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useAuth } from "@lib/supabase/auth-context";

type Plan = {
  id: "free" | "pro" | "elite";
  name: string;
  price: string;
  desc: string;
  bullets?: string[];
  cta: string;
  mode: "free" | "paid";
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
        price: "$0",
        desc: "Get started with the basics. No credit card needed.",
        bullets: ["5 AI Chats/day", "Basic 2D Builder", "Community support"],
        cta: "Start Free",
        mode: "free",
      },
      {
        id: "pro",
        name: "The Architect",
        price: "$19/mo",
        desc: "For builders who want full creative power.",
        bullets: ["Unlimited AI Chats", "3D Engine access", "Egyptian Voice Module", "1-Click Deployment"],
        cta: "Become an Architect",
        mode: "paid",
      },
      {
        id: "elite",
        name: "The Creator",
        price: "$49/mo",
        desc: "Everything in Pro — plus the power to go further.",
        bullets: ["Everything in Pro", "Priority GPU rendering", "Custom Domains", "God Mode"],
        cta: "Unlock God Mode",
        mode: "paid",
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
            const isElite = p.id === "elite";

            return (
              <div
                key={p.id}
                className={[
                  "relative rounded-2xl p-6 border text-left flex flex-col",
                  isPro
                    ? "bg-gradient-to-b from-purple-950/50 to-gray-950 border-purple-500/50 shadow-xl shadow-purple-900/20"
                    : isElite
                      ? "bg-gradient-to-b from-amber-950/30 to-gray-950 border-amber-500/30"
                      : "bg-gray-900 border-gray-800",
                ].join(" ")}
              >
                {isPro && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap">
                    MOST POPULAR
                  </span>
                )}
                {isElite && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap">
                    GOD MODE
                  </span>
                )}

                <div className="mb-4">
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isPro ? "text-purple-400" : isElite ? "text-amber-400" : "text-white/30"}`}>
                    {p.id === "free" ? "Free" : p.id === "pro" ? "Pro" : "Elite"}
                  </p>
                  <div className="text-xl font-bold text-white">{p.name}</div>
                  <div className="text-3xl font-extrabold text-white mt-1">{p.price}</div>
                </div>

                <div className="text-sm text-gray-400 mb-4">{p.desc}</div>

                {p.bullets?.length ? (
                  <ul className="text-sm space-y-2 mb-6 flex-1">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex gap-2 text-gray-300">
                        <span className={`shrink-0 ${isElite ? "text-amber-400" : "text-green-400"}`}>✓</span>
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
                      : isElite
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 hover:shadow-lg hover:shadow-amber-500/20"
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
