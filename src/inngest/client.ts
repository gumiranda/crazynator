import { realtimeMiddleware } from '@inngest/realtime';

import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'crazy-code',
  middleware: [realtimeMiddleware()],
});
