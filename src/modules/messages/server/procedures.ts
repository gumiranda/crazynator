import { protectedProcedure, createTRPCRouter } from '@/trpc/init';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { inngest } from '@/inngest/client';
import { TRPCError } from '@trpc/server';
import { consumeCredits } from '@/lib/usage';

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
        images: z.array(z.string()).optional().default([]),
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
        await consumeCredits();
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Something went wrong',
          });
        } else {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'You have no credits left',
          });
        }
      }
      const createdMessage = await prisma.message.create({
        data: {
          content: input.value,
          role: 'USER',
          type: 'RESULT',
          projectId: project.id,
          images: input.images,
        },
      });
      await inngest.send({
        name: 'code-agent/run',
        data: {
          value: input.value,
          projectId: project.id,
          images: input.images,
        },
      });
      return createdMessage;
    }),
});
