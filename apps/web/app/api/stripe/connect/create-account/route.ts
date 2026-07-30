import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger';
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { country, phone, ip } = body ?? {};

    const account = await stripe.v2.core.accounts.create({
      identity: {
        country: country || "US",
        business_details: {
          phone: phone || "0000000000",
        },
        attestations: {
          terms_of_service: {
            account: {
              date: new Date().toISOString(),
              ip: ip || "172.0.0.0",
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

    return NextResponse.json({ success: true, accountId: account.id });
  } catch (err: any) {
    logger.error("Stripe Connect account creation error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
