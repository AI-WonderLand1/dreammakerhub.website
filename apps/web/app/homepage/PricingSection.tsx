import Link from "next/link";
import type { Plan } from "./data";

export default function PricingSection({ plans }: { plans: Plan[] }) {
  return (
    <section id="pricing" className="relative mx-auto mt-16 w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-950 to-black px-6 py-14 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="relative z-10">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-400">Pricing</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Start free. Scale when ready.</h2>
          <p className="mt-3 text-sm text-gray-400 max-w-xl mx-auto">
            Everything you need to build, launch, and grow — pick the plan that fits your stage.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan: Plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 transition ${
                plan.highlight
                  ? "border-purple-500/60 bg-gradient-to-b from-purple-900/30 to-purple-950/20 shadow-xl shadow-purple-900/20 scale-105"
                  : plan.id === "team"
                  ? "border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-black"
                  : plan.id === "enterprise"
                  ? "border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-black"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap">
                  MOST POPULAR
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                {plan.icon && <span className="text-lg">{plan.icon}</span>}
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  plan.highlight ? "text-purple-400" : plan.id === "team" ? "text-blue-400" : plan.id === "enterprise" ? "text-cyan-400" : "text-white/30"
                }`}>
                  {plan.tier}
                </p>
              </div>
              <p className="text-lg font-bold text-white mb-2">{plan.name}</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                {plan.period && <span className="text-sm text-white/40 mb-1">{plan.period}</span>}
              </div>
              <p className="text-xs text-gray-500 mb-5">{plan.desc}</p>
              <ul className="flex-1 space-y-2 mb-6">
                {plan.bullets.map((b: string) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className={`mt-0.5 shrink-0 ${
                      plan.id === "team" ? "text-blue-400" : plan.id === "enterprise" ? "text-cyan-400" : "text-green-400"
                    }`}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`w-full rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90"
                    : plan.id === "team"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90"
                    : plan.id === "enterprise"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90"
                    : "border border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
