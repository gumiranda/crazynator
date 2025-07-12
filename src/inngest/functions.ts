import { inngest } from './client';
import { openai, createAgent } from '@inngest/agent-kit';
import { Sandbox } from '@e2b/code-interpreter';
import { getSandbox } from './utils';

export const helloWorld = inngest.createFunction(
  { id: 'hello-world' },
  { event: 'test/hello.world' },
  async ({ event, step }) => {
    const sandboxId = await step.run('sandbox', async () => {
      const sandbox = await Sandbox.create('crazystack');
      return sandbox.sandboxId;
    });

    const codeAgent = createAgent({
      name: 'code-agent',
      system:
        'You are an expert code agent.  You write code to solve the problem.  You are using Nextjs and shadcn',
      model: openai({ model: 'gpt-4o' }),
    });
    const { output } = await codeAgent.run(
      `Write a code to solve the problem: ${event.data.value}`,
    );
    const sandboxUrl = await step.run('get-sandbox-url', async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });
    return { output, sandboxUrl };
  },
);
