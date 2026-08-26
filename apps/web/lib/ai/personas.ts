export type AiTier = "free" | "premium";

export type ClientPersona = {
  id: string;
  name: string;
  tagline: string;
  tier: AiTier;
};

// Client-safe persona metadata only — no model identifiers ship to the browser.
export const CLIENT_PERSONAS: ClientPersona[] = [
  {
    id: "alice",
    name: "Alice",
    tagline: "Your Wonderland guide · Free",
    tier: "free",
  },
  {
    id: "simplerick",
    name: "SimpleRick",
    tagline: "Premium genius on demand",
    tier: "premium",
  },
];
