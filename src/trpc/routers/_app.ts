import { createTRPCRouter } from '../init';
import { messagesRouter } from '@/modules/messages/server/procedures';
import { projectsRouter } from '@/modules/projects/server/procedures';
import { usagesRouter } from '@/modules/usage/server/procedures';
import { userSettingsRouter } from '@/modules/user-settings/server/procedures';

export const appRouter = createTRPCRouter({
  messages: messagesRouter,
  projects: projectsRouter,
  usages: usagesRouter,
  userSettings: userSettingsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
