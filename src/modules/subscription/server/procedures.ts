import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getSubscriptionByClerkId, cancelSubscription } from '@/lib/services/subscription';

export const subscriptionRouter = createTRPCRouter({
  // Buscar subscription do usuário atual
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    try {
      const subscription = await getSubscriptionByClerkId(ctx.auth.userId!);
      return subscription;
    } catch (error) {
      console.error('Get current subscription failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Falha ao buscar assinatura atual',
      });
    }
  }),

  // Cancelar subscription
  cancel: protectedProcedure
    .input(
      z.object({
        stripeSubscriptionId: z.string().min(1, { message: 'Stripe Subscription ID is required' }),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const subscription = await cancelSubscription(input.stripeSubscriptionId);
        if (!subscription) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Assinatura não encontrada',
          });
        }
        return subscription;
      } catch (error) {
        console.error('Cancel subscription failed:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha ao cancelar assinatura',
        });
      }
    }),
});
