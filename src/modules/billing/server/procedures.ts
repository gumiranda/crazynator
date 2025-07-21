import { protectedProcedure, createTRPCRouter } from '@/trpc/init';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { stripeService } from '@/lib/stripe-service';
import { subscriptionService } from '@/lib/subscription-service';
import { usageMiddleware } from '@/lib/usage-middleware';

export const billingRouter = createTRPCRouter({
  getPlans: protectedProcedure.query(async () => {
    try {
      const plans = await subscriptionService.getAvailablePlans();
      return plans;
    } catch (error) {
      console.error('Error getting plans:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get plans',
      });
    }
  }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    try {
      const subscription = await subscriptionService.getUserSubscription(ctx.auth.userId);
      return subscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get subscription',
      });
    }
  }),

  getUsage: protectedProcedure.query(async ({ ctx }) => {
    try {
      const usageInfo = await subscriptionService.getUsageInfo(ctx.auth.userId);
      return usageInfo;
    } catch (error) {
      console.error('Error getting usage info:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get usage info',
      });
    }
  }),

  createCheckout: protectedProcedure
    .input(
      z.object({
        priceId: z.string().min(1, { message: 'Price ID is required' }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const successUrl = `${baseUrl}/dashboard/subscription?success=true`;
        const cancelUrl = `${baseUrl}/pricing`;

        const checkoutUrl = await stripeService.createCheckoutSession(
          ctx.auth.userId,
          input.priceId,
          successUrl,
          cancelUrl
        );

        return { url: checkoutUrl };
      } catch (error) {
        console.error('Error creating checkout session:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkout session',
        });
      }
    }),

  createFreeSubscription: protectedProcedure
    .input(
      z.object({
        planId: z.string().min(1, { message: 'Plan ID is required' }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verificar se o plano é realmente gratuito
        const plan = await subscriptionService.getPlanById(input.planId);
        
        if (!plan) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Plan not found',
          });
        }

        if (plan.price !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This endpoint is only for free plans',
          });
        }

        // Verificar se o usuário já tem uma subscription
        const existingSubscription = await subscriptionService.getUserSubscription(ctx.auth.userId);
        
        if (existingSubscription) {
          // Atualizar subscription existente para o plano gratuito
          await subscriptionService.updateSubscriptionPlan(
            existingSubscription.id,
            input.planId
          );
        } else {
          // Criar customer no Stripe (mesmo para planos gratuitos, para facilitar upgrades futuros)
          const customer = await stripeService.getOrCreateCustomer(ctx.auth.userId);
          
          // Criar subscription gratuita diretamente no banco
          await subscriptionService.createSubscription({
            userId: ctx.auth.userId,
            stripeCustomerId: customer.id,
            planId: input.planId,
            status: 'ACTIVE',
          });
        }

        return { success: true };
      } catch (error) {
        console.error('Error creating free subscription:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create free subscription',
        });
      }
    }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const subscription = await subscriptionService.getUserSubscription(ctx.auth.userId);
      
      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No subscription found',
        });
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const returnUrl = `${baseUrl}/dashboard/subscription`;

      const portalUrl = await stripeService.createPortalSession(
        subscription.stripeCustomerId,
        returnUrl
      );

      return { url: portalUrl };
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create portal session',
      });
    }
  }),

  cancelSubscription: protectedProcedure
    .input(
      z.object({
        immediately: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const subscription = await subscriptionService.getUserSubscription(ctx.auth.userId);
        
        if (!subscription || !subscription.stripeSubscriptionId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No active subscription found',
          });
        }

        await stripeService.cancelSubscription(
          subscription.stripeSubscriptionId,
          input.immediately
        );

        return { success: true };
      } catch (error) {
        console.error('Error canceling subscription:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel subscription',
        });
      }
    }),

  upgradeSubscription: protectedProcedure
    .input(
      z.object({
        newPriceId: z.string().min(1, { message: 'New price ID is required' }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const subscription = await subscriptionService.getUserSubscription(ctx.auth.userId);
        
        if (!subscription || !subscription.stripeSubscriptionId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No active subscription found',
          });
        }

        await stripeService.updateSubscription(
          subscription.stripeSubscriptionId,
          input.newPriceId
        );

        return { success: true };
      } catch (error) {
        console.error('Error upgrading subscription:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upgrade subscription',
        });
      }
    }),

  checkUsageLimit: protectedProcedure
    .input(
      z.object({
        resourceType: z.string().min(1, { message: 'Resource type is required' }),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const canUse = await usageMiddleware.preflightCheck(ctx.auth.userId, input.resourceType);
        const limits = await usageMiddleware.getUserLimits(ctx.auth.userId);

        return {
          canUse,
          ...limits,
        };
      } catch (error) {
        console.error('Error checking usage limit:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check usage limit',
        });
      }
    }),

  recordUsage: protectedProcedure
    .input(
      z.object({
        resourceType: z.string().min(1, { message: 'Resource type is required' }),
        amount: z.number().int().positive().default(1),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await usageMiddleware.checkAndRecordUsage(
          ctx.auth.userId,
          input.resourceType,
          input.amount,
          input.metadata
        );

        return { success: true };
      } catch (error) {
        if (usageMiddleware.isUsageLimitError(error)) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: error.message,
            cause: {
              code: error.code,
              resourceType: error.resourceType,
              limit: error.limit,
              current: error.current,
            },
          });
        }

        console.error('Error recording usage:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record usage',
        });
      }
    }),

  getBillingHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(100).default(10),
        offset: z.number().int().nonnegative().default(0),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const subscription = await subscriptionService.getUserSubscription(ctx.auth.userId);
        
        if (!subscription) {
          return [];
        }

        const billingEvents = await subscriptionService.getUserSubscription(ctx.auth.userId);
        
        return billingEvents?.billingEvents
          ?.slice(input.offset, input.offset + input.limit)
          ?.map(event => ({
            id: event.id,
            eventType: event.eventType,
            processedAt: event.processedAt,
            data: event.data,
          })) || [];
      } catch (error) {
        console.error('Error getting billing history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get billing history',
        });
      }
    }),
});