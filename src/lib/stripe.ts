import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
  appInfo: {
    name: 'Crazy Code',
    version: '1.0.0',
  },
});

export const getStripe = () => {
  return stripe;
};