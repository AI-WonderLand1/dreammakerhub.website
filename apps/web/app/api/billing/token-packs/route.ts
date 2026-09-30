import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { authenticatedSupabaseUser } from "@/lib/supabase/authenticated-user.server";
import { resolveTokenPack, tokenPackDefinitions } from "@/lib/billing/token-packs.server";

function publicSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://dreammakerhub.website";
  const url = new URL(configured);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) {
    throw new Error("Public checkout origin must be HTTPS");
  }
  return url;
}

async function publicPacks() {
  if (!stripe) {
    return tokenPackDefinitions().map(({ id, label, tokens }) => ({
      id, label, tokens, available: false, amount: null, currency: null,
    }));
  }

  return Promise.all(tokenPackDefinitions().map(async ({ id, label, tokens, priceId }) => {
    if (!priceId) return { id, label, tokens, available: false, amount: null, currency: null };
    try {
      const price = await stripe.prices.retrieve(priceId);
      const valid = price.active && price.type === "one_time" && price.unit_amount !== null;
      return {
        id, label, tokens,
        available: valid,
        amount: valid ? price.unit_amount : null,
        currency: valid ? price.currency : null,
      };
    } catch {
      return { id, label, tokens, available: false, amount: null, currency: null };
    }
  }));
}

export async function GET() {
  return NextResponse.json(
    { packs: await publicPacks() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!stripe) return NextResponse.json({ error: "Payments are temporarily unavailable" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const pack = resolveTokenPack(body && typeof body === "object" ? (body as { pack?: unknown }).pack : null);
  if (!pack || !pack.priceId) {
    return NextResponse.json({ error: "That token pack is not configured for checkout" }, { status: 400 });
  }

  const price = await stripe.prices.retrieve(pack.priceId);
  if (!price.active || price.type !== "one_time" || price.unit_amount === null) {
    return NextResponse.json({ error: "Token pack payment configuration is invalid" }, { status: 503 });
  }

  const base = publicSiteUrl();
  const success = new URL("/dashboard/usage", base);
  success.searchParams.set("token_purchase", "success");
  const cancel = new URL("/dashboard/usage", base);
  cancel.searchParams.set("token_purchase", "canceled");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: pack.priceId, quantity: 1 }],
    customer_email: user.email || undefined,
    client_reference_id: user.id,
    success_url: success.toString(),
    cancel_url: cancel.toString(),
    metadata: {
      kind: "token_pack",
      userId: user.id,
      tokenPack: pack.id,
      tokenAmount: String(pack.tokens),
    },
  });

  if (!session.url) return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 502 });
  return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
}
