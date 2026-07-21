import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  const plans = {
    pro: {
      id: "pro",
      name: "Pro Plan",
      description: "Full access to all features",
      amount: 1000,
      currency: "usd",
      interval: "month",
    },
    elite: {
      id: "elite",
      name: "Elite Plan",
      description: "Everything in Pro plus priority support",
      amount: 2500,
      currency: "usd",
      interval: "month",
    },
  };

  return NextResponse.json({
    publishableKey: publishableKey || null,
    configured: !!(publishableKey && secretKey),
    plans,
  });
}