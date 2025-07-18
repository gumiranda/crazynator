import { inngest } from './client';
import {
  openai,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
  Message,
  createState,
} from '@inngest/agent-kit';
import { Sandbox } from '@e2b/code-interpreter';
import { getSandbox, lastAssistantTextMessageContent } from './utils';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { SANDBOX_TEMPLATE } from '@/constants/sandbox';
import { PROMPT } from '@/constants/prompt';
interface AgentState {
  summary: string;
  files: { [path: string]: string };
}
export const codeAgentFunction = inngest.createFunction(
  { id: 'code-agent' },
  { event: 'code-agent/run' },
  async ({ event, step }) => {
    const sandboxId = await step.run('sandbox', async () => {
      const sandbox = await Sandbox.create(SANDBOX_TEMPLATE);
      return sandbox.sandboxId;
    });
    const previousMessages = await step.run('previous-messages', async () => {
      const formattedMessages: Message[] = [];
      const messages = await prisma.message.findMany({
        where: {
          projectId: event.data.projectId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      });
      for (const message of messages) {
        formattedMessages.push({
          role: message.role === 'USER' ? 'user' : 'assistant',
          content: message.content,
          type: 'text',
        });
      }
      return formattedMessages.reverse();
    });
    const state = createState<AgentState>(
      {
        summary: '',
        files: {},
      },
      {
        messages: previousMessages,
      },
    );
    const codeAgent = createAgent<AgentState>({
      name: 'code-agent',
      description: 'You are an expert code agent.',
      system: PROMPT,
      model: openai({
        model: 'gpt-4.1',
        defaultParameters: { temperature: 0.1 },
      }),
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
        createTool({
          name: 'createOrUpdateFiles',
          description: 'Create or update files in the sandbox',
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              }),
            ),
          }),
          handler: async ({ files }, { step, network }: Tool.Options<AgentState>) => {
            const newFiles = await step?.run('createOrUpdateFiles', async () => {
              try {
                const updatedFiles = network.state.data.files || {};
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }
                return updatedFiles;
              } catch (e) {
                return `Error creating or updating files: ${e}`;
              }
            });
            if (typeof newFiles === 'object') {
              network.state.data.files = newFiles;
            }
          },
        }),
        createTool({
          name: 'readFiles',
          description: 'Read the files from the sandbox',
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run('readFiles', async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (e) {
                return `Error reading files: ${e}`;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText = lastAssistantTextMessageContent(result);
          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes('<task_summary>')) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: 'coding-agent-network',
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      },
    });
    const result = await network.run(event.data.value, {
      state,
    });
    const isError =
      !result.state.data.summary || Object.keys(result.state.data.files || {}).length === 0;
    const sandboxUrl = await step.run('get-sandbox-url', async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });
    await step.run('save-result', async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            content: 'Something went wrong. Please try again.',
            role: 'ASSISTANT',
            type: 'ERROR',
            projectId: event.data.projectId,
          },
        });
      }
      return await prisma.message.create({
        data: {
          content: result.state.data.summary,
          role: 'ASSISTANT',
          type: 'RESULT',
          fragment: {
            create: {
              title: 'Fragment',
              sandboxUrl: sandboxUrl,
              files: result.state.data.files,
            },
          },
          projectId: event.data.projectId,
        },
      });
    });
    return {
      url: sandboxUrl,
      summary: result.state.data.summary,
      title: 'Fragment',
      files: result.state.data.files,
    };
  },
);
