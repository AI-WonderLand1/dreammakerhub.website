import { MasterBlock } from "../blocks/MasterBlock";
import { logger } from '@/lib/logger';

export const marketingConfig = {
  PricingCard: {
    fields: {
      title: { type: "text" },
      price: { type: "text" },
      billingCycle: { type: "text" },
      features: {
        type: "array",
        getItemSummary: (item: any) => item.feature || "Feature",
        fields: {
          feature: { type: "text" },
        },
      },
      ctaLabel: { type: "text" },
      ctaHref: { type: "text" },
      glowColor: { type: "text" },
    },
    defaultProps: {
      title: "Pro Plan",
      price: "$29",
      billingCycle: "/month",
      features: [
        { feature: "Unlimited AI prompts" },
        { feature: "WebGL scene exports" },
        { feature: "Priority support" },
      ],
      ctaLabel: "Start Pro",
      ctaHref: "/subscription",
      glowColor: "#a855f7",
      iconName: "BadgeDollarSign",
      variant: "neon",
      triggerEvent: "onHover",
    },
    render: ({ title, price, billingCycle, features = [], ctaLabel, ctaHref, ...props }: any) => (
      <MasterBlock title={title || "Pro Plan"} iconName="BadgeDollarSign" variant="neon" {...props}>
        <div className="rounded-xl border border-purple-500/30 bg-black/40 p-5">
          <div className="text-3xl font-black tracking-tight text-white">
            {price}
            <span className="ml-1 text-sm font-medium text-zinc-400">{billingCycle}</span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {features.map((item: any, i: number) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-purple-400">✓</span>
                <span>{item.feature}</span>
              </li>
            ))}
          </ul>
          <a
            href={ctaHref || "/subscription"}
            className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-400"
          >
            {ctaLabel || "Start Pro"}
          </a>
        </div>
      </MasterBlock>
    ),
  },
};
