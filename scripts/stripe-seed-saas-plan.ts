import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

async function seedSaaSPlan() {
  const product = await stripe.products.create({
    name: 'Developer Workspace Tier',
    description: 'Provides dedicated environment provisioning and isolated IDE workspaces.',
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 2900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  console.log(`Product ID: ${product.id}`);
  console.log(`Price ID: ${price.id}`);
  console.log(`\nAdd to .env:\nSTRIPE_SAAS_PRICE_ID=${price.id}`);
}

seedSaaSPlan().catch(console.error);
