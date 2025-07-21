import Stripe from 'stripe';
import { stripe } from './stripe';
import { prisma } from './db';
import type { SubscriptionStatus } from '../generated/prisma';

export interface CreateSubscriptionData {
  userId: string;
  email: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

export interface PlanLimits {
  projects: number;
  apiCalls: number;
  storage: number; // in MB
  [key: string]: number;
}

export class StripeService {
  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    try {
      const customer = await this.getOrCreateCustomer(userId);

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
        },
        allow_promotion_codes: true,
        subscription_data: {
          metadata: {
            userId,
          },
        },
      });

      if (!session.url) {
        throw new Error('Failed to create checkout session URL');
      }

      return session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (subscription?.stripeCustomerId) {
        const customer = await stripe.customers.retrieve(subscription.stripeCustomerId);
        if (!customer.deleted) {
          return customer as Stripe.Customer;
        }
      }

      const customer = await stripe.customers.create({
        metadata: {
          userId,
        },
      });

      return customer;
    } catch (error) {
      console.error('Error getting or creating customer:', error);
      throw error;
    }
  }

  async createCustomer(userId: string, email: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId,
        },
      });

      return customer.id;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }

      return customer as Stripe.Customer;
    } catch (error) {
      console.error('Error retrieving customer:', error);
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, immediately = false): Promise<void> {
    try {
      if (immediately) {
        await stripe.subscriptions.cancel(subscriptionId);
      } else {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId: string, newPriceId: string): Promise<void> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      if (!subscription.items.data[0]) {
        throw new Error('No subscription items found');
      }

      await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  constructEvent(payload: string, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    }

    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Error constructing webhook event:', error);
      throw error;
    }
  }

  async syncProducts(): Promise<void> {
    try {
      const products = await stripe.products.list({
        active: true,
        type: 'service',
      });

      for (const product of products.data) {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        });

        for (const price of prices.data) {
          if (price.type === 'recurring' && price.unit_amount) {
            const existingPlan = await prisma.plan.findUnique({
              where: { stripePriceId: price.id },
            });

            if (!existingPlan) {
              const features: PlanLimits = {
                projects: product.metadata?.projects ? parseInt(product.metadata.projects) : 10,
                apiCalls: product.metadata?.apiCalls ? parseInt(product.metadata.apiCalls) : 1000,
                storage: product.metadata?.storage ? parseInt(product.metadata.storage) : 100,
              };

              await prisma.plan.create({
                data: {
                  name: product.name,
                  stripePriceId: price.id,
                  stripeProductId: product.id,
                  price: price.unit_amount,
                  currency: price.currency,
                  interval: price.recurring?.interval || 'month',
                  features,
                  active: true,
                },
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();