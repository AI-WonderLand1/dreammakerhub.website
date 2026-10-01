import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { authenticatedSupabaseUser } from "@/lib/supabase/authenticated-user.server";
import { renderCreditPackDefinitions, resolveRenderCreditPack } from "@/lib/billing/render-credit-packs.server";

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
    return renderCreditPackDefinitions().map(({ id, label, credits }) => ({
      id, label, credits, available: false, amount: null, currency: null,
    }));
  }

  return Promise.all(renderCreditPackDefinitions().map(async ({ id, label, credits, priceId }) => {
    if (!credits || !priceId) return { id, label, credits, available: false, amount: null, currency: null };
    try {
      const price = await stripe.prices.retrieve(priceId);
      const valid = price.active && price.type === "one_time" && price.unit_amount !== null;
      return {
        id, label, credits,
        available: valid,
        amount: valid ? price.unit_amount : null,
        currency: valid ? price.currency : null,
      };
    } catch {
      return { id, label, credits, available: false, amount: null, currency: null };
    }
  }));
}

export async function GET() {
  return NextResponse.json({ packs: await publicPacks() }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!stripe) return NextResponse.json({ error: "Payments are temporarily unavailable" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const pack = resolveRenderCreditPack(body && typeof body === "object" ? (body as { pack?: unknown }).pack : null);
  if (!pack || !pack.priceId || !pack.credits) {
    return NextResponse.json({ error: "That 3D credit pack is not configured for checkout" }, { status: 400 });
  }

  const price = await stripe.prices.retrieve(pack.priceId);
  if (!price.active || price.type !== "one_time" || price.unit_amount === null) {
    return NextResponse.json({ error: "3D credit payment configuration is invalid" }, { status: 503 });
  }

  const base = publicSiteUrl();
  const success = new URL("/dashboard/usage/additional-details", base);
  success.searchParams.set("credit_purchase", "success");
  const cancel = new URL("/dashboard/usage/additional-details", base);
  cancel.searchParams.set("credit_purchase", "canceled");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: pack.priceId, quantity: 1 }],
    customer_email: user.email || undefined,
    client_reference_id: user.id,
    success_url: success.toString(),
    cancel_url: cancel.toString(),
    metadata: {
      kind: "render_credit_pack",
      userId: user.id,
      renderPack: pack.id,
      renderCredits: String(pack.credits),
    },
  });

  if (!session.url) return NextResponse.json({ error: "Payment checkout did not return a URL" }, { status: 502 });
  return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
}
