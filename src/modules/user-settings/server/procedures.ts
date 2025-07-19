import { z } from 'zod';
import { procedure, router } from '@/trpc/init';
import { prisma } from '@/lib/db';

const createUserSettingsSchema = z.object({
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  preferredProvider: z.enum(['openai', 'anthropic']).default('openai'),
  openaiModel: z.string().default('gpt-4o'),
  anthropicModel: z.string().default('claude-3-5-sonnet-20241022'),
});

const updateUserSettingsSchema = z.object({
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  preferredProvider: z.enum(['openai', 'anthropic']).optional(),
  openaiModel: z.string().optional(),
  anthropicModel: z.string().optional(),
});

export const userSettingsRouter = router({
  get: procedure.query(async ({ ctx }) => {
    const settings = await prisma.userSettings.findUnique({
      where: {
        userId: ctx.auth.userId,
      },
    });

    if (!settings) {
      // Return default settings if none exist
      return {
        id: '',
        userId: ctx.auth.userId,
        openaiApiKey: null,
        anthropicApiKey: null,
        preferredProvider: 'openai',
        openaiModel: 'gpt-4o',
        anthropicModel: 'claude-3-5-sonnet-20241022',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return settings;
  }),

  create: procedure
    .input(createUserSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      const settings = await prisma.userSettings.create({
        data: {
          userId: ctx.auth.userId,
          ...input,
        },
      });

      return settings;
    }),

  update: procedure
    .input(updateUserSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      const settings = await prisma.userSettings.upsert({
        where: {
          userId: ctx.auth.userId,
        },
        create: {
          userId: ctx.auth.userId,
          openaiApiKey: input.openaiApiKey,
          anthropicApiKey: input.anthropicApiKey,
          preferredProvider: input.preferredProvider || 'openai',
          openaiModel: input.openaiModel || 'gpt-4o',
          anthropicModel: input.anthropicModel || 'claude-3-5-sonnet-20241022',
        },
        update: input,
      });

      return settings;
    }),

  delete: procedure.mutation(async ({ ctx }) => {
    await prisma.userSettings.delete({
      where: {
        userId: ctx.auth.userId,
      },
    });

    return { success: true };
  }),
});