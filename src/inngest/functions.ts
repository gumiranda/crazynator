import { inngest } from './client';
import {
  createAgent,
  createNetwork,
  createTool,
  openai,
  type Tool,
  type Message,
  createState,
} from '@inngest/agent-kit';
import { getSandbox, lastAssistantTextMessageContent } from './utils';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from '@/constants/prompt';
import { createSandbox } from '@/lib/sandbox';
import { projectChannel } from './channels';
import { 
  githubSyncFunction, 
  githubInitialSyncFunction, 
  githubBatchSyncFunction,
  githubBatchFilesSyncFunction,
  githubPullBatchProcessorFunction
} from './github-functions';

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}
const generatedAgentResponse = (output: Message[], defaultValue: string) => {
  if (output[0].type !== 'text') {
    return defaultValue;
  }
  if (Array.isArray(output[0].content)) {
    return output[0].content.map((text) => text.text).join('');
  }
  return output[0].content;
};
const codeAgentFunction = inngest.createFunction(
  { id: 'code-agent' },
  { event: 'code-agent/run' },
  async ({ event, step, publish }) => {
    const sandboxId = await step.run('get-sandbox-id', async () => {
      const sandbox = await createSandbox();
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
    const fragmentTitleGenerator = createAgent({
      name: 'Fragment Title Generator',
      description: 'An expert title generator for code fragments',
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({
        model: 'gpt-4o-mini',
      }),
    });

    const responseGenerator = createAgent({
      name: 'Response Generator',
      description: 'An expert response generator for code fragments',
      system: RESPONSE_PROMPT,
      model: openai({
        model: 'gpt-4o-mini',
      }),
    });

    const [fragmentTitleOutput, responseOutput] = await Promise.all([
      fragmentTitleGenerator.run(result.state.data.summary),
      responseGenerator.run(result.state.data.summary),
    ]);

    const isError =
      !result.state.data.summary || Object.keys(result.state.data.files || {}).length === 0;
    const sandboxUrl = await step.run('get-sandbox-url', async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    const savedMessage = await step.run('save-result', async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            content: 'Something went wrong. Please try again.',
            role: 'ASSISTANT',
            type: 'ERROR',
            projectId: event.data.projectId,
          },
          include: {
            fragment: true,
          },
        });
      }
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: generatedAgentResponse(
            responseOutput.output,
            'Something went wrong. Please try again.',
          ),
          role: 'ASSISTANT',
          type: 'RESULT',
          fragment: {
            create: {
              sandboxUrl,
              title: generatedAgentResponse(fragmentTitleOutput.output, 'Fragment'),
              files: result.state.data.files,
            },
          },
        },
        include: {
          fragment: true,
        },
      });
    });
    
    // Trigger GitHub sync if repository exists and fragment was created successfully
    if (!isError && savedMessage.fragment) {
      await step.run('trigger-github-sync', async () => {
        try {
          // Check if project has a GitHub repository
          const githubRepo = await prisma.gitHubRepository.findUnique({
            where: { projectId: event.data.projectId },
          });
          
          if (githubRepo) {
            // Send GitHub sync event
            await inngest.send({
              name: 'github/sync',
              data: {
                fragmentId: savedMessage.fragment!.id,
                projectId: event.data.projectId,
                commitMessage: `Update project files: ${savedMessage.fragment!.title}`,
              },
            });
          }
        } catch (error) {
          console.error('Failed to trigger GitHub sync:', error);
          // Don't fail the main function if GitHub sync fails
        }
      });
    }
    
    await publish(projectChannel(event.data.projectId).realtime(savedMessage));

    return {
      message: savedMessage,
      url: sandboxUrl,
      title: savedMessage.fragment?.title || 'Fragment',
      files: result.state.data.files,
      summary: result.state.data.summary,
      fragment: savedMessage.fragment,
    };
  },
);

import {
  sandboxMaintenanceFunction,
  recreateSandboxFunction,
} from './sandbox-functions';

// Export all functions
export { 
  codeAgentFunction, 
  githubSyncFunction, 
  githubInitialSyncFunction, 
  githubBatchSyncFunction,
  githubBatchFilesSyncFunction,
  githubPullBatchProcessorFunction,
  sandboxMaintenanceFunction,
  recreateSandboxFunction,
};
