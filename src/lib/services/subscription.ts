// lib/services/subscription.ts
import type { Subscription as PrismaSubscription } from '../../generated/prisma';
import Stripe from 'stripe';
import { prisma } from '../db';

export interface CreateSubscriptionData {
  clerkUserId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  priceId: string;
  cancelAtPeriodEnd?: boolean;
}

export async function createSubscription(
  data: CreateSubscriptionData,
): Promise<PrismaSubscription> {
  return await prisma.subscription.create({
    data,
  });
}

export async function updateSubscriptionByStripeId(
  stripeSubscriptionId: string,
  data: Partial<CreateSubscriptionData>,
): Promise<PrismaSubscription | null> {
  return await prisma.subscription.update({
    where: {
      stripeSubscriptionId,
    },
    data,
  });
}

export async function getSubscriptionByClerkId(
  clerkUserId: string,
): Promise<PrismaSubscription | null> {
  return await prisma.subscription.findUnique({
    where: {
      clerkUserId,
    },
  });
}

export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string,
): Promise<PrismaSubscription | null> {
  return await prisma.subscription.findUnique({
    where: {
      stripeSubscriptionId,
    },
  });
}

export async function cancelSubscription(
  stripeSubscriptionId: string,
): Promise<PrismaSubscription | null> {
  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-07-30.basil',
  });

  try {
    // Cancel subscription in Stripe
    await stripe.subscriptions.cancel(stripeSubscriptionId);

    // Update subscription in database
    return await prisma.subscription.update({
      where: {
        stripeSubscriptionId,
      },
      data: {
        status: 'canceled',
        cancelAtPeriodEnd: true,
      },
    });
  } catch (error) {
    console.error('Error canceling subscription in Stripe:', error);
    throw error;
  }
}

export async function createOrUpdateSubscriptionFromStripe(
  stripeSubscription: Stripe.Subscription,
  clerkUserId?: string,
): Promise<PrismaSubscription> {
  // Extract only the essential fields from Stripe.Subscription
  const subscriptionData = {
    stripeCustomerId: stripeSubscription.customer as string,
    stripeSubscriptionId: stripeSubscription.id,
    status: stripeSubscription.status,
    priceId: stripeSubscription.items.data[0]?.price.id || '',
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
  };

  // Try to find existing subscription
  const existingSubscription = await getSubscriptionByStripeId(stripeSubscription.id);

  if (existingSubscription) {
    // Update existing subscription
    const updatedSubscription = await updateSubscriptionByStripeId(
      stripeSubscription.id,
      subscriptionData,
    );
    if (!updatedSubscription) {
      throw new Error('Falha ao atualizar assinatura existente');
    }
    return updatedSubscription;
  } else {
    // Create new subscription - clerkUserId is required for new subscriptions
    if (!clerkUserId) {
      throw new Error('clerkUserId é obrigatório para criar nova assinatura');
    }

    return await createSubscription({
      clerkUserId,
      ...subscriptionData,
    });
  }
}
