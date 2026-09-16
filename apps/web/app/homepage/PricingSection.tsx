import Link from "next/link";
import type { Plan } from "./data";

type CompareRow = {
  label: string;
  values: Record<string, string>;
};

const COMPARISON_ROWS: CompareRow[] = [
  { label: "Price", values: { free: "$0 forever", pro: "$39/mo", team: "$129/mo", enterprise: "Custom" } },
  { label: "Active projects", values: { free: "1", pro: "—", team: "—", enterprise: "Unlimited" } },
  { label: "AI chats", values: { free: "5/day", pro: "Unlimited", team: "Unlimited", enterprise: "Unlimited" } },
  { label: "WonderBuild", values: { free: "Included", pro: "Included", team: "Included", enterprise: "Included" } },
  { label: "1-click deployment", values: { free: "—", pro: "Included", team: "Included", enterprise: "Included" } },
  { label: "Custom domain", values: { free: "Subdomain", pro: "Included", team: "Included", enterprise: "Included" } },
  { label: "Team seats", values: { free: "—", pro: "—", team: "Up to 5", enterprise: "Custom" } },
  { label: "Shared asset library", values: { free: "—", pro: "—", team: "Included", enterprise: "Included" } },
  { label: "AI agent seats", values: { free: "—", pro: "—", team: "3", enterprise: "Custom" } },
  { label: "Collaborative IDE", values: { free: "—", pro: "—", team: "Included", enterprise: "Included" } },
  { label: "Always-on runners", values: { free: "—", pro: "—", team: "Included", enterprise: "Included" } },
  { label: "White-label", values: { free: "—", pro: "—", team: "Ready", enterprise: "Included" } },
  { label: "Compute credits", values: { free: "—", pro: "—", team: "300K/mo", enterprise: "Custom package" } },
  { label: "SSO + SCIM", values: { free: "—", pro: "—", team: "—", enterprise: "Included" } },
  { label: "Private cloud / on-prem", values: { free: "—", pro: "—", team: "—", enterprise: "Available" } },
  { label: "Dedicated account manager", values: { free: "—", pro: "—", team: "—", enterprise: "Included" } },
  { label: "SLA-backed uptime", values: { free: "—", pro: "—", team: "—", enterprise: "Included" } },
];

function planTone(plan: Plan) {
  if (plan.highlight) return "border-violet-300/80 bg-gradient-to-b from-violet-50/88 to-white/82 shadow-xl shadow-violet-200/30";
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
          <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">Pricing</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Start free. Compare before you upgrade.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
            The prices and included features below come from the current plan configuration used by DreamMakerHub.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
            <h3 className="text-2xl font-black">Plan comparison</h3>
            <p className="mt-1 text-sm text-slate-700">A feature-by-feature view, because four marketing cards somehow never answer the actual question.</p>
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
                      const value = row.values[plan.id] ?? "—";
                      const muted = value === "—";
                      return <td key={plan.id} className={`px-5 py-4 text-center ${muted ? "text-slate-300" : "font-medium text-slate-700"}`}>{value}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200/80 bg-amber-50/75 px-5 py-4 text-xs leading-5 text-amber-900 sm:px-6">
            “—” means the current plan configuration does not explicitly promise that feature. Enterprise availability is based on the existing Enterprise plan details and may require a custom agreement.
          </div>
        </div>
      </div>
    </section>
  );
}
