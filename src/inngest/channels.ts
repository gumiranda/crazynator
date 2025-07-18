import { channel, topic } from '@inngest/realtime';

export const projectChannel = channel((projectId: string) => `project:${projectId}`).addTopic(
  topic('realtime'),
);
