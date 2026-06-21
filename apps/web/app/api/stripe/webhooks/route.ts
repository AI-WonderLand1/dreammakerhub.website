"use strict";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
  typescript: false,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = endpointSecret;
  
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  
  switch (event.type) {
    case "customer.subscription.created":
      const subscription = event.data.object as Stripe.Subscription;
      console.log("Subscription created:", subscription.id);
      break;
    case "customer.subscription.updated":
      const updatedSubscription = event.data.object as Stripe.Subscription;
      console.log("Subscription updated:", updatedSubscription.id);
      break;
    case "customer.subscription.deleted":
      const deletedSubscription = event.data.object as Stripe.Subscription;
      console.log("Subscription deleted:", deletedSubscription.id);
      break;
    case "invoice.payment_succeeded":
      const invoice = event.data.object as Stripe.Invoice;
      console.log("Payment succeeded:", invoice.id);
      break;
    case "invoice.payment_failed":
      const failedInvoice = event.data.object as Stripe.Invoice;
      console.log("Payment failed:", failedInvoice.id);
      break;
  }
  
  return NextResponse.json({ received: true });
}
