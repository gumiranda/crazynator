import { baseProcedure, createTRPCRouter } from '@/trpc/init';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { inngest } from '@/inngest/client';

export const messagesRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        projectId: z.string().min(1, { message: 'Project is required' }),
      }),
    )
    .query(async ({ input }) => {
      const messages = await prisma.message.findMany({
        orderBy: {
          updatedAt: 'asc',
        },
        where: {
          projectId: input.projectId,
        },
      });
      return messages;
    }),
  create: baseProcedure
    .input(
      z.object({
        value: z.string().min(1, { message: 'Message is required' }),
        projectId: z.string().min(1, { message: 'Project is required' }),
      }),
    )
    .mutation(async ({ input }) => {
      const createdMessage = await prisma.message.create({
        data: {
          content: input.value,
          role: 'USER',
          type: 'RESULT',
          projectId: input.projectId,
        },
      });
      await inngest.send({
        name: 'code-agent/run',
        data: {
          value: input.value,
          projectId: input.projectId,
        },
      });
      return createdMessage;
    }),
});
