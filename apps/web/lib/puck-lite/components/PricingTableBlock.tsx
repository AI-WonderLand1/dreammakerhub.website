"use client";

export type PricingTableBlockProps = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  freeLabel: string;
  proLabel: string;
  eliteLabel: string;
};

type PlanConfig = {
  id: string;
  tier: string;
  name: string;
  price: string;
  period: string;
  desc: string;
  bullets: string[];
  style: "default" | "popular" | "elite";
};

export default function PricingTableBlock({
  eyebrow = "Pricing",
  headline = "Start free. Scale when ready.",
  subheadline = "Pick the plan that fits your stage.",
  freeLabel = "Start Free",
  proLabel = "Become an Architect",
  eliteLabel = "Unlock God Mode",
}: PricingTableBlockProps) {
  const plans: PlanConfig[] = [
    {
      id: "free",
      tier: "Free",
      name: "The Nomad",
      price: "$0",
      period: "",
      desc: "Get started with the basics. No credit card needed.",
      bullets: ["5 AI Chats/day", "Basic 2D Builder", "Community support"],
      style: "default",
    },
    {
      id: "pro",
      tier: "Pro",
      name: "The Architect",
      price: "$19",
      period: "/mo",
      desc: "For builders who want full creative power.",
      bullets: ["Unlimited AI Chats", "3D Engine access", "Egyptian Voice Module", "1-Click Deployment"],
      style: "popular",
    },
    {
      id: "elite",
      tier: "Elite",
      name: "The Creator",
      price: "$49",
      period: "/mo",
      desc: "Everything in Pro — plus the power to go further.",
      bullets: ["Everything in Pro", "Priority GPU rendering", "Custom Domains", "God Mode"],
      style: "elite",
    },
  ];

  const ctaLabels: Record<string, string> = {
    free: freeLabel,
    pro: proLabel,
    elite: eliteLabel,
  };

  const cardStyles = {
    default: "border-white/10 bg-white/[0.03]",
    popular: "border-purple-500/60 bg-gradient-to-b from-purple-900/30 to-purple-950/20 shadow-xl shadow-purple-900/20",
    elite: "border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-black",
  };

  const tierColors = {
    default: "text-white/30",
    popular: "text-purple-400",
    elite: "text-amber-400",
  };

  const checkColors = {
    default: "text-green-400",
    popular: "text-green-400",
    elite: "text-amber-400",
  };

  const btnStyles = {
    default: "border border-white/20 bg-white/5 text-white/80 hover:bg-white/10",
    popular: "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90",
    elite: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90",
  };

  return (
    <div className="p-4" data-block="pricing-table">
      <div className="mb-8 text-center">
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-400">{eyebrow}</p>}
        {headline && <h2 className="text-3xl font-extrabold text-white">{headline}</h2>}
        {subheadline && <p className="mt-2 text-sm text-white/50">{subheadline}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl border p-6 ${cardStyles[plan.style]}`}
          >
            {plan.style === "popular" && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap">
                MOST POPULAR
              </span>
            )}
            {plan.style === "elite" && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap">
                GOD MODE
              </span>
            )}
            <p className={`mb-0.5 text-[10px] font-bold uppercase tracking-widest ${tierColors[plan.style]}`}>
              {plan.tier}
            </p>
            <p className="mb-2 text-lg font-bold text-white">{plan.name}</p>
            <div className="mb-1 flex items-end gap-1">
              <span className="text-4xl font-extrabold text-white">{plan.price}</span>
              {plan.period && <span className="mb-1 text-sm text-white/40">{plan.period}</span>}
            </div>
            <p className="mb-5 text-xs text-white/40">{plan.desc}</p>
            <ul className="mb-6 flex-1 space-y-2">
              {plan.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs text-white/70">
                  <span className={`shrink-0 ${checkColors[plan.style]}`}>✓</span>
                  {b}
                </li>
              ))}
            </ul>
            <button className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${btnStyles[plan.style]}`}>
              {ctaLabels[plan.id]}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
