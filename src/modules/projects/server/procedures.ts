import { baseProcedure, createTRPCRouter } from '@/trpc/init';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { inngest } from '@/inngest/client';

export const projectsRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    const projects = await prisma.project.findMany({
      orderBy: {
        updatedAt: 'asc',
      },
    });
    return projects;
  }),
  create: baseProcedure
    .input(
      z.object({
        value: z.string().min(1, { message: 'Project name is required' }),
      }),
    )
    .mutation(async ({ input }) => {
      const createdProject = await prisma.project.create({
        data: {
          name: input.value,
        },
      });
      await inngest.send({
        name: 'code-agent/run',
        data: {
          projectId: createdProject.id,
        },
      });
      return createdProject;
    }),
});
