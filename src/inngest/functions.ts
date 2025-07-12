import { inngest } from './client';
import { openai, createAgent, createTool } from '@inngest/agent-kit';
import { Sandbox } from '@e2b/code-interpreter';
import { getSandbox } from './utils';
import { z } from 'zod';

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
      tools: [
        createTool({
          name: 'terminal',
          description: 'Use the terminal to run commands',
          handler: async ({ command }, { step }) => {
            return await step?.run('terminal', async () => {
              const buffers = { stdout: '', stderr: '' };
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return result.stdout;
              } catch (e) {
                const messageError = `Command failed: ${e}\nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
                console.error(messageError);
                return messageError;
              }
            });
          },
          parameters: z.object({
            command: z.string(),
          }),
        }),
      ],
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
