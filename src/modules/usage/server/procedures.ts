import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { getUsageStatusWithStripe } from '@/lib/usage-integration';

export const usagesRouter = createTRPCRouter({
  status: protectedProcedure.query(async ({ ctx }) => {
    try {
      const result = await getUsageStatusWithStripe();
      return result;
    } catch (err) {
      console.error('Get usage status failed', err);
      return null;
    }
  }),
});
