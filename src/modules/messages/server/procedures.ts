import { protectedProcedure, createTRPCRouter } from '@/trpc/init';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { inngest } from '@/inngest/client';
import { TRPCError } from '@trpc/server';
import { consumeCreditsWithStripe } from '@/lib/usage-integration';

export const messagesRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, { message: 'Project is required' }),
      }),
    )
    .query(async ({ input, ctx }) => {
      const messages = await prisma.message.findMany({
        orderBy: {
          updatedAt: 'asc',
        },
        include: {
          fragment: true,
        },
        where: {
          projectId: input.projectId,
          project: {
            userId: ctx.auth.userId,
          },
        },
      });
      return messages;
    }),
  create: protectedProcedure
    .input(
      z.object({
        value: z.string().min(1, { message: 'Message is required' }),
        projectId: z.string().min(1, { message: 'Project is required' }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
      });
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }
      try {
        await consumeCreditsWithStripe();
      } catch (error: any) {
        if (error.code === 'USAGE_LIMIT_EXCEEDED') {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Usage limit exceeded for ${error.resourceType}. You've used ${error.current} out of ${error.limit} allowed.`,
          });
        } else if (error.code === 'NO_SUBSCRIPTION') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Please subscribe to a plan to continue using this feature.',
          });
        } else if (error.code === 'INACTIVE_SUBSCRIPTION') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Your subscription is not active. Please check your billing status.',
          });
        } else {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Something went wrong',
          });
        }
      }
      const createdMessage = await prisma.message.create({
        data: {
          content: input.value,
          role: 'USER',
          type: 'RESULT',
          projectId: project.id,
        },
      });
      await inngest.send({
        name: 'code-agent/run',
        data: {
          value: input.value,
          projectId: project.id,
        },
      });
      return createdMessage;
    }),
});
