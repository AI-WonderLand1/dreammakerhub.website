import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { stripe } from "@/lib/stripe";

function connectEnabled(): boolean {
  return process.env.STRIPE_CONNECT_ENABLED === "true";
}

function clientIp(request: NextRequest): string | null {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  );
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!connectEnabled()) {
    return NextResponse.json({ error: "Stripe Connect provisioning is disabled" }, { status: 503 });
  }

  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const body = await request.json().catch(() => null);
    const country = typeof body?.country === "string" ? body.country.trim().toUpperCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const ip = clientIp(request);

    if (!/^[A-Z]{2}$/.test(country)) {
      return NextResponse.json({ error: "Valid 2-letter country code required" }, { status: 400 });
    }
    if (!/^\+?[0-9 ()-]{7,25}$/.test(phone)) {
      return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
    }
    if (!ip) {
      return NextResponse.json({ error: "Client network address unavailable" }, { status: 400 });
    }

    const account = await stripe.v2.core.accounts.create({
      identity: {
        country,
        business_details: { phone },
        attestations: {
          terms_of_service: {
            account: {
              date: new Date().toISOString(),
              ip,
            },
          },
        },
      },
      dashboard: "full",
      defaults: {
        responsibilities: {
          losses_collector: "stripe",
          fees_collector: "stripe",
        },
      },
    });

    logger.info("Stripe Connect account created", { userId, accountId: account.id });
    return NextResponse.json(
      { success: true, accountId: account.id },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err: unknown) {
    logger.error("Stripe Connect account creation error:", err);
    return NextResponse.json({ error: "Stripe Connect account creation failed" }, { status: 500 });
  }
}
