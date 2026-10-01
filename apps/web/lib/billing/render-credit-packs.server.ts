import "server-only";

export type RenderCreditPackId = "starter" | "builder" | "power";

type RenderCreditPackDefinition = {
  id: RenderCreditPackId;
  label: string;
  unitsEnvKey: string;
  priceEnvKey: string;
};

const PACKS: readonly RenderCreditPackDefinition[] = [
  { id: "starter", label: "Starter 3D Credits", unitsEnvKey: "RENDER_CREDIT_PACK_STARTER_UNITS", priceEnvKey: "STRIPE_RENDER_CREDIT_PACK_STARTER_PRICE_ID" },
  { id: "builder", label: "Builder 3D Credits", unitsEnvKey: "RENDER_CREDIT_PACK_BUILDER_UNITS", priceEnvKey: "STRIPE_RENDER_CREDIT_PACK_BUILDER_PRICE_ID" },
  { id: "power", label: "Power 3D Credits", unitsEnvKey: "RENDER_CREDIT_PACK_POWER_UNITS", priceEnvKey: "STRIPE_RENDER_CREDIT_PACK_POWER_PRICE_ID" },
] as const;

function positiveInteger(value: string | undefined) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 1_000_000 ? parsed : null;
}

export function renderCreditPackDefinitions() {
  return PACKS.map((pack) => ({
    id: pack.id,
    label: pack.label,
    credits: positiveInteger(process.env[pack.unitsEnvKey]),
    priceId: process.env[pack.priceEnvKey]?.trim() || null,
  }));
}

export function resolveRenderCreditPack(id: unknown) {
  if (typeof id !== "string") return null;
  const pack = renderCreditPackDefinitions().find((item) => item.id === id);
  return pack?.credits && pack.priceId ? pack : null;
}
