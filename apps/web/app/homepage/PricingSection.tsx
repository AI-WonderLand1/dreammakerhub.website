import Link from "next/link";
import { formatBytes, formatNumber, PLAN_LIMITS } from "@/lib/billing/limits";
import type { Plan } from "./data";

type CompareRow = {
  label: string;
  value: (plan: Plan) => string;
};

function limitsFor(plan: Plan) {
  return PLAN_LIMITS[plan.id as keyof typeof PLAN_LIMITS];
}

const COMPARISON_ROWS: CompareRow[] = [
  { label: "Price", value: (plan) => `${plan.price}${plan.period}` },
  {
    label: "AI credits / month",
    value: (plan) => plan.id === "enterprise"
      ? "Custom"
      : `${formatNumber(limitsFor(plan).aiTokensMonthly)}${plan.id === "team" ? " pooled" : ""}`,
  },
  {
    label: "3D credits / month",
    value: (plan) => plan.id === "enterprise"
      ? "Custom"
      : `${formatNumber(limitsFor(plan).renderCreditsMonthly)}${plan.id === "team" ? " pooled" : ""}`,
  },
  {
    label: "Projects",
    value: (plan) => {
      if (plan.id === "enterprise") return "Custom";
      const limit = limitsFor(plan).projectsLimit;
      return limit >= 999999 ? "Large pooled" : formatNumber(limit);
    },
  },
  {
    label: "Included storage",
    value: (plan) => plan.id === "enterprise"
      ? "Custom"
      : `${formatBytes(limitsFor(plan).storageLimit)}${plan.id === "team" ? " pooled" : ""}`,
  },
  { label: "AI / 3D top-ups", value: (plan) => plan.id === "enterprise" ? "Contract" : "Available" },
  { label: "WonderSpace cloud IDE", value: (plan) => plan.id === "enterprise" ? "By agreement" : "Controlled beta" },
];

function planTone(plan: Plan) {
  if (plan.highlight) return "border-violet-300/80 bg-gradient-to-b from-violet-50/88 to-white/82 shadow-xl shadow-violet-200/30";
  if (plan.id === "creator") return "border-fuchsia-200/80 bg-gradient-to-b from-fuchsia-50/86 to-white/80";
  if (plan.id === "studio") return "border-indigo-200/80 bg-gradient-to-b from-indigo-50/86 to-white/80";
  if (plan.id === "team") return "border-blue-200/80 bg-gradient-to-b from-blue-50/86 to-white/80";
  if (plan.id === "enterprise") return "border-cyan-200/80 bg-gradient-to-b from-cyan-50/86 to-white/80";
  return "border-white/80 bg-white/78";
}

export default function PricingSection({ plans }: { plans: Plan[] }) {
  return (
    <section id="pricing" className="relative z-10 overflow-hidden bg-gradient-to-b from-white/82 via-sky-50/78 to-amber-50/76 px-5 py-20 text-slate-950 backdrop-blur-[1px] sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,.10),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">AI WONDERLAND memberships</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">One membership across the whole platform.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
            Builder, AI Playground, 3D/NPC tools, usage and billing share one AI WONDERLAND account. Pick the membership that matches how much you build; buy extra AI or 3D credits without subscribing to each product separately.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className={`relative flex flex-col rounded-2xl border p-6 backdrop-blur-md ${planTone(plan)}`}>
              {plan.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">Most popular</span>}
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.15em] text-slate-500">
                <span className="text-xl">{plan.icon}</span>{plan.tier}
              </div>
              <h3 className="mt-3 text-2xl font-black">{plan.name}</h3>
              <div className="mt-4 flex items-end gap-1"><span className="text-4xl font-black tracking-tight">{plan.price}</span>{plan.period && <span className="mb-1 text-sm text-slate-500">{plan.period}</span>}</div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{plan.desc}</p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-700">
                {plan.bullets.map((item) => <li key={item} className="flex gap-2"><span className="text-emerald-600">✓</span><span>{item}</span></li>)}
              </ul>
              <Link href={plan.href} className={`mt-7 rounded-xl px-4 py-3 text-center text-sm font-black transition ${plan.highlight ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110" : "border border-slate-300/80 bg-white/85 text-slate-900 hover:bg-white"}`}>{plan.cta}</Link>
            </article>
          ))}
        </div>

        <div className="mt-14 overflow-hidden rounded-2xl border border-white/80 bg-white/78 shadow-xl shadow-slate-200/30 backdrop-blur-md">
          <div className="border-b border-slate-200/80 bg-white/55 px-5 py-5 sm:px-6">
            <h3 className="text-2xl font-black">Membership comparison</h3>
            <p className="mt-1 text-sm text-slate-700">The same included allowances used by the subscription checkout and billing dashboard.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-white/65">
                  <th className="sticky left-0 z-10 bg-white/90 px-5 py-4 font-black text-slate-900 backdrop-blur">Feature</th>
                  {plans.map((plan) => <th key={plan.id} className="px-5 py-4 text-center font-black text-slate-900">{plan.tier}<div className="mt-1 text-xs font-medium text-slate-500">{plan.price}{plan.period}</div></th>)}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, index) => (
                  <tr key={row.label} className={index % 2 ? "bg-white/42" : "bg-white/62"}>
                    <th className={`sticky left-0 z-10 px-5 py-4 font-semibold text-slate-800 backdrop-blur ${index % 2 ? "bg-white/88" : "bg-white/94"}`}>{row.label}</th>
                    {plans.map((plan) => {
                      const value = row.value(plan);
                      return <td key={plan.id} className="px-5 py-4 text-center font-medium text-slate-700">{value}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200/80 bg-amber-50/75 px-5 py-4 text-xs leading-5 text-amber-900 sm:px-6">
            WonderSpace remains controlled beta until customer provisioning is fully verified. The Architect of Worlds is a custom enterprise agreement rather than self-service checkout.
          </div>
        </div>
      </div>
    </section>
  );
}
