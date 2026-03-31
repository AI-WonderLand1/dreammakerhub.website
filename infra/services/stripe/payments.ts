import Stripe from 'stripe';
import { env, requireEnv } from '../../lib/env';
import { logger } from '../../lib/logger';

/** * STRIPE SERVICE
 * Production-ready singleton for managing subscriptions and checkouts.
 */

const stripeSecret = requireEnv(env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY");

export const stripe = new Stripe(stripeSecret, {
  apiVersion: '2024-06-20', // Use the version matching your node_modules
  typescript: true,
});

export const stripeService = {
  /**
   * Creates a checkout session for the AI-WONDERLAND marketplace or subscriptions
   */
  createCheckoutSession: async (priceId: string, customerId?: string) => {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${requireEnv(env.NEXT_PUBLIC_URL, "NEXT_PUBLIC_URL")}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${requireEnv(env.NEXT_PUBLIC_URL, "NEXT_PUBLIC_URL")}/pricing`,
      });

      return { url: session.url };
    } catch (error) {
      logger.error('[STRIPE_ERROR]', { error });
      throw new Error('Failed to create checkout session');
    }
  },

  /**
   * Retrieves subscription status for the "WonderSpace" access control
   */
  getSubscriptionStatus: async (subscriptionId: string) => {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription.status;
  },
};
