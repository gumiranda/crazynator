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
  return await prisma.subscription.create(
    {
      data,
    },
  );
}

export async function updateSubscriptionByStripeId(
  stripeSubscriptionId: string,
  data: Partial<CreateSubscriptionData>,
): Promise<PrismaSubscription | null> {
  return await prisma.subscription.update(
    {
      where: {
        stripeSubscriptionId,
      },
      data,
    },
  );
}

export async function getSubscriptionByClerkId(
  clerkUserId: string,
): Promise<PrismaSubscription | null> {
  return await prisma.subscription.findUnique(
    {
      where: {
        clerkUserId,
      },
    },
  );
}

export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string,
): Promise<PrismaSubscription | null> {
  return await prisma.subscription.findUnique(
    {
      where: {
        stripeSubscriptionId,
      },
    },
  );
}

export async function cancelSubscription(
  stripeSubscriptionId: string,
): Promise<PrismaSubscription | null> {
  try {
    const stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY!,
      {
        apiVersion: '2025-07-30.basil',
      },
    );
    await stripe.subscriptions.cancel(
      stripeSubscriptionId,
    );
  } catch (error) {
    console.error(
      'Erro ao cancelar assinatura:',
      error,
    );
    throw error;
  }
  return await prisma.subscription.update(
    {
      where: {
        stripeSubscriptionId,
      },
      data: {
        status: 'canceled',
        cancelAtPeriodEnd: true,
      },
    },
  );
}

export async function createOrUpdateSubscriptionFromStripe(
  stripeSubscription: Stripe.Subscription,
  clerkUserId?: string,
): Promise<PrismaSubscription> {
  // Extract only the essential fields from Stripe.Subscription
  const subscriptionData = {
    stripeCustomerId:
      stripeSubscription.customer as string,
    stripeSubscriptionId:
      stripeSubscription.id,
    status: stripeSubscription.status,
    priceId:
      stripeSubscription.items.data[0]
        ?.price.id || '',
    cancelAtPeriodEnd:
      stripeSubscription.cancel_at_period_end,
  };

  // Try to find existing subscription
  const existingSubscription =
    await getSubscriptionByStripeId(
      stripeSubscription.id,
    );

  if (existingSubscription) {
    // Update existing subscription
    const updatedSubscription =
      await updateSubscriptionByStripeId(
        stripeSubscription.id,
        subscriptionData,
      );
    if (!updatedSubscription) {
      throw new Error(
        'Falha ao atualizar assinatura existente',
      );
    }
    return updatedSubscription;
  } else {
    // Create new subscription - clerkUserId is required for new subscriptions
    if (!clerkUserId) {
      throw new Error(
        'clerkUserId é obrigatório para criar nova assinatura',
      );
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
    displayName: 'Free'
  },
  BASIC: {
    credits: 20,
    duration: 30 * 24 * 60 * 60, // 30 days
    displayName: 'Basic'
  },
  PRO: {
    credits: 50,
    duration: 30 * 24 * 60 * 60, // 30 days
    displayName: 'Pro'
  }
};

export function getPlanFromPriceId(priceId: string): UserPlan {
  const basicPriceId = process.env.STRIPE_PRICE_ID_BASIC;
  const proPriceId = process.env.STRIPE_PRICE_ID_PRO;

  console.log('🔍 [getPlanFromPriceId] Comparing price IDs:', {
    inputPriceId: priceId,
    basicPriceId,
    proPriceId,
    basicMatch: priceId === basicPriceId,
    proMatch: priceId === proPriceId
  });

  if (priceId === basicPriceId) {
    console.log('✅ [getPlanFromPriceId] Matched BASIC plan');
    return 'BASIC';
  }
  if (priceId === proPriceId) {
    console.log('✅ [getPlanFromPriceId] Matched PRO plan');
    return 'PRO';
  }
  
  console.log('❌ [getPlanFromPriceId] No match found, returning FREE plan');
  return 'FREE';
}

export function getPlanInfo(plan: UserPlan): PlanInfo {
  return {
    type: plan,
    ...PLAN_CONFIG[plan]
  };
}

export async function getCurrentUserPlan(): Promise<PlanInfo> {
  const { userId } = await auth();
  console.log('🔍 [getCurrentUserPlan] userId:', userId);
  
  if (!userId) {
    console.log('❌ [getCurrentUserPlan] No userId, returning FREE plan');
    return getPlanInfo('FREE');
  }

  // Buscar TODAS as assinaturas do usuário
  const allSubscriptions = await prisma.subscription.findMany({
    where: {
      clerkUserId: userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log('🔍 [getCurrentUserPlan] ALL subscriptions found:', {
    total: allSubscriptions.length,
    subscriptions: allSubscriptions.map(sub => ({
      id: sub.id,
      status: sub.status,
      priceId: sub.priceId,
      createdAt: sub.createdAt,
      stripeSubscriptionId: sub.stripeSubscriptionId
    }))
  });

  const subscription = await getSubscriptionByClerkId(userId);
  console.log('🔍 [getCurrentUserPlan] ACTIVE subscription found:', {
    exists: !!subscription,
    status: subscription?.status,
    priceId: subscription?.priceId,
    clerkUserId: subscription?.clerkUserId,
    stripeSubscriptionId: subscription?.stripeSubscriptionId
  });
  
  if (!subscription || subscription.status !== 'active') {
    console.log('❌ [getCurrentUserPlan] No active subscription, returning FREE plan');
    return getPlanInfo('FREE');
  }

  console.log('🔍 [getCurrentUserPlan] Environment price IDs:', {
    basicPriceId: process.env.STRIPE_PRICE_ID_BASIC,
    proPriceId: process.env.STRIPE_PRICE_ID_PRO,
    subscriptionPriceId: subscription.priceId
  });

  // Verificar se há uma assinatura PRO mais recente que não foi sincronizada
  const proSubscriptions = allSubscriptions.filter(sub => sub.priceId === process.env.STRIPE_PRICE_ID_PRO);
  if (proSubscriptions.length > 0) {
    console.log('🚨 [getCurrentUserPlan] PRO subscriptions found in DB:', proSubscriptions);
  }

  const plan = getPlanFromPriceId(subscription.priceId);
  console.log('✅ [getCurrentUserPlan] Detected plan:', plan);
  
  return getPlanInfo(plan);
}

// Função para debug - buscar assinaturas do Stripe diretamente
export async function debugStripeSubscriptions(clerkUserId: string) {
  try {
    // Primeiro buscar o customer do Stripe através das assinaturas no banco
    const dbSubscriptions = await prisma.subscription.findMany({
      where: { clerkUserId }
    });
    
    console.log('🔍 [debugStripeSubscriptions] DB subscriptions:', dbSubscriptions);
    
    if (dbSubscriptions.length > 0) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-07-30.basil',
      });
      
      const customerId = dbSubscriptions[0].stripeCustomerId;
      console.log('🔍 [debugStripeSubscriptions] Stripe Customer ID:', customerId);
      
      // Buscar todas as assinaturas do customer no Stripe
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10
      });
      
      console.log('🔍 [debugStripeSubscriptions] Stripe subscriptions:', {
        total: stripeSubscriptions.data.length,
        subscriptions: stripeSubscriptions.data.map(sub => ({
          id: sub.id,
          status: sub.status,
          priceId: sub.items.data[0]?.price.id,
          created: new Date(sub.created * 1000),
          current_period_start: new Date(sub.current_period_start * 1000),
          cancel_at_period_end: sub.cancel_at_period_end
        }))
      });
      
      return stripeSubscriptions.data;
    }
  } catch (error) {
    console.error('❌ [debugStripeSubscriptions] Error:', error);
  }
  return [];
}
