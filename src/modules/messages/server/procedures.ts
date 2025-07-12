import { baseProcedure, createTRPCRouter } from '@/trpc/init';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { inngest } from '@/inngest/client';

export const messagesRouter = createTRPCRouter({
  create: baseProcedure
    .input(
      z.object({
        value: z.string().min(1, { message: 'Message is required' }),
      }),
    )
    .mutation(async ({ input }) => {
      const createdMessage = await prisma.message.create({
        data: {
          content: input.value,
          role: 'USER',
          type: 'RESULT',
        },
      });
      await inngest.send({
        name: 'test/hello.world',
        data: {
          value: input.value,
        },
      });
      return createdMessage;
    }),
});
