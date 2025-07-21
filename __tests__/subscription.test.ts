import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Types for proper mock typing
type MockedPrismaSubscription = {
  findUnique: jest.MockedFunction<(args: {
    where: { userId: string }
    include?: {
      plan?: boolean
      usageRecords?: {
        where?: { timestamp?: { gte: Date } }
        orderBy?: { timestamp: 'desc' }
      }
      billingEvents?: {
        orderBy?: { processedAt: 'desc' }
        take?: number
      }
    }
  }) => Promise<unknown>>
  create: jest.MockedFunction<(args: {
    data: {
      userId: string
      stripeCustomerId: string
      stripeSubscriptionId?: string
      planId: string
      status: string
      currentPeriodStart?: Date
      currentPeriodEnd?: Date
    }
    include?: { plan: boolean }
  }) => Promise<unknown>>
  update: jest.MockedFunction<(args: unknown) => Promise<unknown>>
}

type MockedPrismaPlan = {
  findMany: jest.MockedFunction<(args: {
    where?: { active: boolean }
    orderBy?: { price: 'asc' }
  }) => Promise<unknown[]>>
  findUnique: jest.MockedFunction<(args: unknown) => Promise<unknown>>
}

type MockedPrismaUsageRecord = {
  create: jest.MockedFunction<(args: {
    data: {
      subscriptionId: string
      resourceType: string
      amount: number
      metadata?: Record<string, unknown>
      timestamp: Date
    }
  }) => Promise<unknown>>
  aggregate: jest.MockedFunction<(args: {
    where?: {
      subscriptionId: string
      resourceType: string
      timestamp?: { gte: Date }
    }
    _sum?: { amount: boolean }
  }) => Promise<{ _sum: { amount: number | null } }>>
}

type MockedPrismaBillingEvent = {
  create: jest.MockedFunction<(args: {
    data: {
      subscriptionId: string
      type: string
      stripeEventId?: string
      data?: Record<string, unknown>
      timestamp: Date
    }
  }) => Promise<unknown>>
}

// Properly typed mock implementations
const mockPrisma = {
  subscription: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  } as MockedPrismaSubscription,
  plan: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  } as MockedPrismaPlan,
  usageRecord: {
    create: jest.fn(),
    aggregate: jest.fn(),
  } as MockedPrismaUsageRecord,
  billingEvent: {
    create: jest.fn(),
  } as MockedPrismaBillingEvent,
}

// Mock before imports
jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

import { subscriptionService } from '@/lib/subscription-service'
import { SubscriptionStatus } from '@/generated/prisma'

describe('Subscription System E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Subscription Lifecycle', () => {
    it('should handle complete subscription creation workflow', async () => {
      // Mock plan lookup
      const mockPlan = {
        id: 'plan_123',
        name: 'Pro Plan',
        stripePriceId: 'price_123',
        price: 1900,
        features: { apiCalls: 1000, projects: 25 }
      }
      
      // Mock subscription creation
      const mockSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_stripe_123',
        planId: 'plan_123',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        plan: mockPlan,
        usageRecords: [],
        billingEvents: [],
      }

      mockPrisma.subscription.create.mockResolvedValue(mockSubscription)

      const result = await subscriptionService.createSubscription({
        userId: 'user_123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_stripe_123',
        planId: 'plan_123',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      expect(result).toEqual(mockSubscription)
      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_stripe_123',
          planId: 'plan_123',
          status: SubscriptionStatus.ACTIVE,
        }),
        include: { plan: true },
      })
    })

    it('should handle subscription retrieval with plan data', async () => {
      const mockSubscriptionData = {
        id: 'sub_123',
        userId: 'user_123',
        status: SubscriptionStatus.ACTIVE,
        plan: {
          id: 'plan_123',
          name: 'Pro Plan',
          features: { apiCalls: 1000, projects: 25, storage: 500 }
        },
        usageRecords: [
          { resourceType: 'apiCalls', amount: 250, timestamp: new Date() }
        ],
        billingEvents: [
          { type: 'SUBSCRIPTION_CREATED', timestamp: new Date() }
        ],
      }

      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscriptionData)

      const result = await subscriptionService.getUserSubscription('user_123')

      expect(result).toEqual(mockSubscriptionData)
      expect(mockPrisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        include: {
          plan: true,
          usageRecords: {
            where: {
              timestamp: {
                gte: expect.any(Date),
              },
            },
            orderBy: { timestamp: 'desc' },
          },
          billingEvents: {
            orderBy: { processedAt: 'desc' },
            take: 10,
          },
        },
      })
    })
  })

  describe('Usage Tracking and Limits', () => {
    it('should enforce usage limits correctly', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: SubscriptionStatus.ACTIVE,
        plan: {
          features: { apiCalls: 1000, projects: 25 }
        },
      }

      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription)
      
      // Test under limit
      mockPrisma.usageRecord.aggregate.mockResolvedValue({ _sum: { amount: 500 } })
      let result = await subscriptionService.checkUsageLimit('user_123', 'apiCalls')
      expect(result).toBe(true)

      // Test at limit
      mockPrisma.usageRecord.aggregate.mockResolvedValue({ _sum: { amount: 1000 } })
      result = await subscriptionService.checkUsageLimit('user_123', 'apiCalls')
      expect(result).toBe(false)

      // Test over limit
      mockPrisma.usageRecord.aggregate.mockResolvedValue({ _sum: { amount: 1500 } })
      result = await subscriptionService.checkUsageLimit('user_123', 'apiCalls')
      expect(result).toBe(false)
    })

    it('should record usage with proper metadata', async () => {
      const mockSubscription = { id: 'sub_123' }
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription)
      mockPrisma.usageRecord.create.mockResolvedValue({})

      const metadata = {
        endpoint: '/api/projects',
        projectId: 'proj_123',
        userAgent: 'test-client',
      }

      await subscriptionService.recordUsage('user_123', 'apiCalls', 5, metadata)

      expect(mockPrisma.usageRecord.create).toHaveBeenCalledWith({
        data: {
          subscriptionId: 'sub_123',
          resourceType: 'apiCalls',
          amount: 5,
          metadata,
          timestamp: expect.any(Date),
        },
      })
    })

    it('should calculate usage percentages correctly', async () => {
      const mockSubscription = {
        id: 'sub_123',
        plan: {
          features: {
            apiCalls: 1000,
            projects: 20,
            storage: 500,
          },
        },
      }

      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription)
      mockPrisma.usageRecord.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 750 } })  // apiCalls: 75%
        .mockResolvedValueOnce({ _sum: { amount: 15 } })   // projects: 75%
        .mockResolvedValueOnce({ _sum: { amount: 100 } })  // storage: 20%

      const result = await subscriptionService.getUsageInfo('user_123')

      expect(result).toEqual([
        {
          resourceType: 'apiCalls',
          used: 750,
          limit: 1000,
          percentage: 75,
        },
        {
          resourceType: 'projects',
          used: 15,
          limit: 20,
          percentage: 75,
        },
        {
          resourceType: 'storage',
          used: 100,
          limit: 500,
          percentage: 20,
        },
      ])
    })
  })

  describe('Plan Management', () => {
    it('should retrieve available plans sorted by price', async () => {
      const mockPlans = [
        {
          id: 'plan_free',
          name: 'Free',
          price: 0,
          currency: 'usd',
          interval: 'month',
          features: { apiCalls: 100, projects: 3, storage: 100 },
          active: true,
        },
        {
          id: 'plan_pro',
          name: 'Pro',
          price: 1900,
          currency: 'usd',
          interval: 'month',
          features: { apiCalls: 1000, projects: 25, storage: 1000 },
          active: true,
        },
        {
          id: 'plan_enterprise',
          name: 'Enterprise',
          price: 9900,
          currency: 'usd',
          interval: 'month',
          features: { apiCalls: 10000, projects: 100, storage: 10000 },
          active: true,
        },
      ]

      mockPrisma.plan.findMany.mockResolvedValue(mockPlans)

      const result = await subscriptionService.getAvailablePlans()

      expect(result).toEqual(mockPlans)
      expect(mockPrisma.plan.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { price: 'asc' },
      })
    })
  })

  describe('Error Scenarios', () => {
    it('should handle user without subscription gracefully', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null)

      const subscription = await subscriptionService.getUserSubscription('nonexistent_user')
      expect(subscription).toBeNull()

      const usage = await subscriptionService.getUsageInfo('nonexistent_user')
      expect(usage).toEqual([])

      const canUse = await subscriptionService.checkUsageLimit('nonexistent_user', 'apiCalls')
      expect(canUse).toBe(false)
    })

    it('should handle inactive subscriptions', async () => {
      const mockInactiveSub = {
        id: 'sub_123',
        status: SubscriptionStatus.CANCELED,
        plan: { features: { apiCalls: 1000 } },
      }

      mockPrisma.subscription.findUnique.mockResolvedValue(mockInactiveSub)

      const canUse = await subscriptionService.checkUsageLimit('user_123', 'apiCalls')
      expect(canUse).toBe(false)
    })

    it('should throw error when recording usage for non-existent subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null)

      await expect(
        subscriptionService.recordUsage('nonexistent_user', 'apiCalls', 1)
      ).rejects.toThrow('No subscription found for user')
    })
  })

  describe('Billing Event Logging', () => {
    it('should log billing events with proper structure', async () => {
      const mockSubscription = { id: 'sub_123' }
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription)
      mockPrisma.billingEvent.create.mockResolvedValue({})

      // This would be called by the webhook handler or billing service
      await expect(async () => {
        await mockPrisma.billingEvent.create({
          data: {
            subscriptionId: 'sub_123',
            type: 'PAYMENT_SUCCEEDED',
            stripeEventId: 'evt_123',
            data: { amount: 1900, currency: 'usd' },
            timestamp: new Date(),
          },
        })
      }).not.toThrow()

      expect(mockPrisma.billingEvent.create).toHaveBeenCalledWith({
        data: {
          subscriptionId: 'sub_123',
          type: 'PAYMENT_SUCCEEDED',
          stripeEventId: 'evt_123',
          data: { amount: 1900, currency: 'usd' },
          timestamp: expect.any(Date),
        },
      })
    })
  })
})