import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import type { PlanDefinition } from "../apps/web/lib/billing/plans";
import { selectCatalogCheckoutPriceId, stripePriceMatchesPlan } from
  "../apps/web/lib/billing/stripe-catalog-price";

const pro = {
  id: "pro", name: "architect", displayName: "Architect",
  price: 3900, yearlyPrice: 39000, priceDisplay: "$39/mo",
  yearlyPriceDisplay: "$390/yr", interval: "month",
  description: "test", features: [], stripeProductId: "prod_new_pro",
} as PlanDefinition;
const guild = {
  ...pro, id: "team", name: "guild", price: 12900,
  yearlyPrice: 129000, stripeProductId: "prod_new_guild",
} as PlanDefinition;

function price(
  id: string, product: string, amount: number,
  interval: "month" | "year", active = true,
): Stripe.Price {
  return {
    id, product, unit_amount: amount, currency: "usd",
    type: "recurring", active, recurring: {
      interval, usage_type: "licensed",
    },
  } as unknown as Stripe.Price;
}

describe("Stripe catalogue checkout and signed-webhook price matching", () => {
  it("selects the Pro month and year prices only for the correct product", () => {
    const month = price("price_pro_month", "prod_new_pro", 3900, "month");
    const year = price("price_pro_year", "prod_new_pro", 39000, "year");
    const oldProduct = price("price_old", "prod_old_pro", 3900, "month");
    expect(selectCatalogCheckoutPriceId([oldProduct, month, year], pro, "month"))
      .toBe(month.id);
    expect(selectCatalogCheckoutPriceId([year, month], pro, "year"))
      .toBe(year.id);
    expect(stripePriceMatchesPlan(oldProduct, pro, "month")).toBe(false);
  });

  it("uses Stripe's default when Guild has duplicate monthly prices", () => {
    const first = price("price_guild_default", "prod_new_guild", 12900, "month");
    const second = price("price_guild_duplicate", "prod_new_guild", 12900, "month");
    const annual = price("price_guild_annual", "prod_new_guild", 129000, "year");
    const prices = [second, annual, first];
    expect(selectCatalogCheckoutPriceId(prices, guild, "month")).toBeNull();
    expect(selectCatalogCheckoutPriceId(prices, guild, "month", first.id)).toBe(first.id);
    expect(selectCatalogCheckoutPriceId(prices, guild, "month", annual.id)).toBeNull();
    expect(selectCatalogCheckoutPriceId(prices, guild, "year")).toBe(annual.id);
  });

  it("refuses archived prices and incorrect amounts or intervals", () => {
    const archived = price("price_archived", "prod_new_pro", 3900, "month", false);
    const wrongAmount = price("price_wrong_amount", "prod_new_pro", 2000, "month");
    const wrongTerm = price("price_wrong_term", "prod_new_pro", 3900, "year");
    expect(selectCatalogCheckoutPriceId(
      [archived, wrongAmount, wrongTerm], pro, "month",
    )).toBeNull();
    expect(stripePriceMatchesPlan(wrongAmount, pro, "month")).toBe(false);
    expect(stripePriceMatchesPlan(wrongTerm, pro, "month")).toBe(false);
  });

  it("accepts a legacy explicit price only if no product was configured", () => {
    const legacy = { ...pro, stripeProductId: undefined, stripePriceId: "price_exact" };
    const verified = price("price_exact", "prod_old", 3900, "month");
    const other = price("price_other", "prod_old", 3900, "month");
    expect(stripePriceMatchesPlan(verified, legacy, "month")).toBe(true);
    expect(stripePriceMatchesPlan(other, legacy, "month")).toBe(false);
  });

  it("rejects wrong currency, metering mode, and product even at the same price", () => {
    const valid = price("price_correct", "prod_new_pro", 3900, "month");
    expect(stripePriceMatchesPlan({...valid, currency: "eur"}, pro, "month")).toBe(false);
    expect(stripePriceMatchesPlan({...valid, recurring: {
      ...valid.recurring!, usage_type: "metered",
    }}, pro, "month")).toBe(false);
    expect(stripePriceMatchesPlan({...valid, product: "prod_other"}, pro, "month")).toBe(false);
  });
});
