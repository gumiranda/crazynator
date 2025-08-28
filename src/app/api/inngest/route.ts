import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { 
  codeAgentFunction, 
  githubSyncFunction, 
  githubInitialSyncFunction, 
  githubBatchSyncFunction,
  githubBatchFilesSyncFunction,
  githubPullBatchProcessorFunction
} from '@/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    codeAgentFunction,
    githubSyncFunction,
    githubInitialSyncFunction,
    githubBatchSyncFunction,
    githubBatchFilesSyncFunction,
    githubPullBatchProcessorFunction,
  ],
});
