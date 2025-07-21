/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from './db';
import type { Subscription, Plan, UsageRecord, SubscriptionStatus } from '../generated/prisma';
import { Prisma } from '../generated/prisma';
import { PlanLimits } from './stripe-service';

export interface CreateSubscriptionData {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}

export interface UsageInfo {
  resourceType: string;
  used: number;
  limit: number;
  percentage: number;
}

export class SubscriptionService {
  async getUserSubscription(
    userId: string,
  ): Promise<
    (Subscription & { plan: Plan; usageRecords: UsageRecord[]; billingEvents: any[] }) | null
  > {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: {
          plan: true,
          usageRecords: {
            where: {
              timestamp: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
            orderBy: {
              timestamp: 'desc',
            },
          },
          billingEvents: {
            orderBy: {
              processedAt: 'desc',
            },
            take: 10, // Limit to last 10 events
          },
        },
      });

      return subscription;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  }

  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    try {
      const subscription = await prisma.subscription.create({
        data: {
          userId: data.userId,
          stripeCustomerId: data.stripeCustomerId,
          stripeSubscriptionId: data.stripeSubscriptionId,
          planId: data.planId,
          status: data.status,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
        },
        include: {
          plan: true,
        },
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
    additionalData?: {
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd?: boolean;
    },
  ): Promise<void> {
    try {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status,
          ...additionalData,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  }

  async updateSubscriptionByStripeId(
    stripeSubscriptionId: string,
    updates: Partial<{
      status: SubscriptionStatus;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      cancelAtPeriodEnd: boolean;
      planId: string;
    }>,
  ): Promise<void> {
    try {
      await prisma.subscription.update({
        where: { stripeSubscriptionId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating subscription by Stripe ID:', error);
      throw error;
    }
  }

  async recordUsage(
    userId: string,
    resourceType: string,
    amount: number = 1,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        throw new Error('No subscription found for user');
      }

      await prisma.usageRecord.create({
        data: {
          subscriptionId: subscription.id,
          resourceType,
          amount,
          metadata: metadata ? metadata : undefined,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Log error in production, but don't pollute test output
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error recording usage:', error);
      }
      throw error;
    }
  }

  async checkUsageLimit(userId: string, resourceType: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        return false; // No subscription means no access
      }

      if (subscription.status !== 'ACTIVE') {
        return false; // Inactive subscription
      }

      const planLimits = subscription.plan.features as PlanLimits;
      const limit = planLimits[resourceType];

      if (!limit) {
        return true; // No limit defined for this resource
      }

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const usageCount = await prisma.usageRecord.aggregate({
        where: {
          subscriptionId: subscription.id,
          resourceType,
          timestamp: {
            gte: startOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const totalUsed = usageCount._sum.amount || 0;
      return totalUsed < limit;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return false;
    }
  }

  async getUsageInfo(userId: string): Promise<UsageInfo[]> {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        return [];
      }

      const planLimits = subscription.plan.features as PlanLimits;
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const usageInfos: UsageInfo[] = [];

      for (const [resourceType, limit] of Object.entries(planLimits)) {
        const usageCount = await prisma.usageRecord.aggregate({
          where: {
            subscriptionId: subscription.id,
            resourceType,
            timestamp: {
              gte: startOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const used = usageCount._sum.amount || 0;
        const percentage = Math.min((used / limit) * 100, 100);

        usageInfos.push({
          resourceType,
          used,
          limit,
          percentage,
        });
      }

      return usageInfos;
    } catch (error) {
      console.error('Error getting usage info:', error);
      throw error;
    }
  }

  async resetUsage(subscriptionId: string): Promise<void> {
    try {
      // Usually called when subscription renews
      // We don't delete old records for analytics, just mark them as archived
      const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      // Update metadata to indicate this usage period has been reset
      await prisma.usageRecord.updateMany({
        where: {
          subscriptionId,
          timestamp: {
            lt: currentMonth,
          },
          metadata: {
            path: ['archived'],
            equals: Prisma.AnyNull,
          },
        },
        data: {
          metadata: {
            archived: true,
            archivedAt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Error resetting usage:', error);
      throw error;
    }
  }

  async getAvailablePlans(): Promise<Plan[]> {
    try {
      const plans = await prisma.plan.findMany({
        where: {
          active: true,
        },
        orderBy: {
          price: 'asc',
        },
      });

      return plans;
    } catch (error) {
      console.error('Error getting available plans:', error);
      throw error;
    }
  }

  async getPlanLimits(planId: string): Promise<PlanLimits> {
    try {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new Error('Plan not found');
      }

      return plan.features as PlanLimits;
    } catch (error) {
      console.error('Error getting plan limits:', error);
      throw error;
    }
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      return subscription?.status === 'ACTIVE';
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId },
        include: {
          plan: true,
        },
      });

      return subscription;
    } catch (error) {
      console.error('Error getting subscription by Stripe ID:', error);
      throw error;
    }
  }

  async getPlanById(planId: string): Promise<Plan | null> {
    try {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      });

      return plan;
    } catch (error) {
      console.error('Error getting plan by ID:', error);
      throw error;
    }
  }

  async updateSubscriptionPlan(subscriptionId: string, planId: string): Promise<void> {
    try {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          planId,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }
  }

  async logBillingEvent(
    subscriptionId: string,
    eventType: string,
    stripeEventId: string,
    data: any,
  ): Promise<void> {
    try {
      await prisma.billingEvent.create({
        data: {
          subscriptionId,
          eventType,
          stripeEventId,
          data: data,
        },
      });
    } catch (error) {
      console.error('Error logging billing event:', error);
      throw error;
    }
  }
}

export const subscriptionService = new SubscriptionService();
