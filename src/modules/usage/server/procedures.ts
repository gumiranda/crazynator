import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { getUsageStatus, checkCreditsAvailable, validateCreditsBeforeAction } from '@/lib/usage';
import { TRPCError } from '@trpc/server';

export const usagesRouter = createTRPCRouter({
  status: protectedProcedure.query(async () => {
    try {
      const result = await getUsageStatus();
      return result;
    } catch (err) {
      console.error('Get usage status failed', err);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get usage status',
      });
    }
  }),
  
  checkAvailable: protectedProcedure.query(async () => {
    try {
      return await checkCreditsAvailable();
    } catch (err) {
      console.error('Check credits availability failed', err);
      return false;
    }
  }),
  
  validate: protectedProcedure.mutation(async () => {
    try {
      const status = await validateCreditsBeforeAction();
      return {
        success: true,
        status
      };
    } catch (err) {
      if (err instanceof Error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: err.message,
        });
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to validate credits',
      });
    }
  }),
});
