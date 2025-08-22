// lib/services/subscription.ts
import { prisma } from '@/lib/prisma';
import { Subscription as PrismaSubscription } from '@prisma/client';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';

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
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-07-30.basil',
    });
    await stripe.subscriptions.cancel(stripeSubscriptionId);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
  return await prisma.subscription.update({
    where: {
      stripeSubscriptionId,
    },
    data: {
      status: 'canceled',
      cancelAtPeriodEnd: true,
    },
  });
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
      throw new Error('Failed to update existing subscription');
    }
    return updatedSubscription;
  } else {
    // Create new subscription - clerkUserId is required for new subscriptions
    if (!clerkUserId) {
      throw new Error('clerkUserId is required to create new subscription');
    }

    return await createSubscription({
      clerkUserId,
      ...subscriptionData,
    });
  }
}

// Plan types and credit limits
export type UserPlan = 'FREE' | 'BASIC' | 'PRO';

export interface PlanInfo {
  type: UserPlan;
  credits: number;
  duration: number; // in seconds
  displayName: string;
}

const PLAN_CONFIG: Record<UserPlan, Omit<PlanInfo, 'type'>> = {
  FREE: {
    credits: 5,
    duration: 30 * 24 * 60 * 60, // 30 days
    displayName: 'Free',
  },
  BASIC: {
    credits: 20,
    duration: 30 * 24 * 60 * 60, // 30 days
    displayName: 'Basic',
  },
  PRO: {
    credits: 50,
    duration: 30 * 24 * 60 * 60, // 30 days
    displayName: 'Pro',
  },
};

export function getPlanFromPriceId(priceId: string): UserPlan {
  const basicPriceId = process.env.STRIPE_PRICE_ID_BASIC;
  const proPriceId = process.env.STRIPE_PRICE_ID_PRO;

  if (priceId === basicPriceId) {
    return 'BASIC';
  }
  if (priceId === proPriceId) {
    return 'PRO';
  }

  return 'FREE';
}

export function getPlanInfo(plan: UserPlan): PlanInfo {
  return {
    type: plan,
    ...PLAN_CONFIG[plan],
  };
}

export async function getCurrentUserPlan(): Promise<PlanInfo> {
  const { userId } = await auth();

  if (!userId) {
    return getPlanInfo('FREE');
  }

  const subscription = await getSubscriptionByClerkId(userId);

  if (!subscription || subscription.status !== 'active') {
    return getPlanInfo('FREE');
  }

  const plan = getPlanFromPriceId(subscription.priceId);

  return getPlanInfo(plan);
}

// Debug function - search Stripe subscriptions directly
export async function debugStripeSubscriptions(clerkUserId: string) {
  try {
    // First find the Stripe customer through database subscriptions
    const dbSubscriptions = await prisma.subscription.findMany({
      where: { clerkUserId },
    });

    if (dbSubscriptions.length > 0) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-07-30.basil',
      });

      const customerId = dbSubscriptions[0].stripeCustomerId;

      // Find all customer subscriptions in Stripe
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10,
      });

      return stripeSubscriptions.data;
    }
  } catch (error) {
    console.error('❌ [debugStripeSubscriptions] Error:', error);
  }
  return [];
}
