import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { getUsageStatus } from '@/lib/usage';

export const usagesRouter = createTRPCRouter({
  status: protectedProcedure.query(async () => {
    try {
      const result = await getUsageStatus();
      return result;
    } catch (err) {
      console.error('Get usage status failed', err);
      return null;
    }
  }),
});
