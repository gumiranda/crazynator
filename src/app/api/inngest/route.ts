import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { codeAgentFunction } from '@/inngest/functions';
import { 
  compositeModelMdFunction,
  compositeModelLgFunction,
  smartModelSelectionFunction 
} from '@/inngest/composite-model-functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    codeAgentFunction,
    compositeModelMdFunction,
    compositeModelLgFunction,
    smartModelSelectionFunction,
  ],
});
