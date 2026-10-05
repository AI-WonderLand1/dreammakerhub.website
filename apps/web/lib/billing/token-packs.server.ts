import "server-only";

export type TokenPackId = "starter" | "builder" | "power";

type TokenPackDefinition = {
  id: TokenPackId;
  label: string;
  tokens: number;
  envKey: string;
};

const PACKS: readonly TokenPackDefinition[] = [
  { id: "starter", label: "Starter AI Credits", tokens: 500_000, envKey: "STRIPE_TOKEN_PACK_STARTER_PRICE_ID" },
  { id: "builder", label: "Builder AI Credits", tokens: 2_000_000, envKey: "STRIPE_TOKEN_PACK_BUILDER_PRICE_ID" },
  { id: "power", label: "Power AI Credits", tokens: 10_000_000, envKey: "STRIPE_TOKEN_PACK_POWER_PRICE_ID" },
] as const;

export function tokenPackDefinitions() {
  return PACKS.map((pack) => ({
    ...pack,
    priceId: process.env[pack.envKey]?.trim() || null,
  }));
}

export function resolveTokenPack(id: unknown) {
  if (typeof id !== "string") return null;
  return tokenPackDefinitions().find((pack) => pack.id === id) || null;
}
