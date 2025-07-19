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
import { prisma } from '@/lib/db';
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from '@/constants/prompt';
import { createSandbox, createSandboxWithCodegen } from '@/lib/sandbox';
import { projectChannel } from './channels';

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
export const codeAgentFunction = inngest.createFunction(
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

export const codeAgentWithCodegenFunction = inngest.createFunction(
  { id: 'code-agent-with-codegen' },
  { event: 'code-agent/run-with-codegen' },
  async ({ event, step, publish }) => {
    const sandboxId = await step.run('get-sandbox-id-with-codegen', async () => {
      // Usar o novo template que inclui sistema de geração automatizada
      const sandbox = await createSandboxWithCodegen();
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
    
    // Prompt aprimorado para sistemas com geração de código
    const CODEGEN_PROMPT = `${PROMPT}

IMPORTANT: This project includes an automated code generation system using Plop.js. The user can generate code automatically with the following commands:

- npm run generate (interactive menu)
- npm run gen:component (React components)
- npm run gen:page (Next.js pages)
- npm run gen:module (complete modules)
- npm run gen:trpc (tRPC routers)
- npm run gen:hook (custom hooks)
- npm run gen:store (Zustand stores)
- npm run gen:ai (AI-optimized templates)

When implementing features, prefer using these generators for:
1. Creating the base structure
2. Maintaining consistency
3. Following established patterns

Then extend the generated code with specific functionality. This approach is 10x faster and ensures consistency.

The project follows a modular architecture:
- src/modules/[entity]/ for feature modules
- src/components/ for React components
- src/app/ for Next.js pages
- plop-templates/ contains all code generation templates

Always suggest using code generation when appropriate, and explain how the generated code can be extended.`;

    const codeAgent = createAgent<AgentState>({
      name: 'code-agent-with-codegen',
      description: 'You are an expert code agent with automated code generation capabilities.',
      system: CODEGEN_PROMPT,
      model: openai({
        model: 'gpt-4.1',
        defaultParameters: { temperature: 0.1 },
      }),
      tools: [
        createTool({
          name: 'terminal',
          description: 'Use the terminal to run commands, including code generation commands',
          handler: async ({ command }, { step }) => {
            const { output } = await step.run('run-terminal-command', async () => {
              const sandbox = await getSandbox(sandboxId);
              return await sandbox.process.start({
                cmd: command,
              });
            });
            return output;
          },
          schema: z.object({
            command: z.string().describe('The terminal command to run'),
          }),
        }),
        createTool({
          name: 'edit_file',
          description: 'Edit or create a file with the given content',
          handler: async ({ path, content }, { step }) => {
            const sandbox = await getSandbox(sandboxId);
            await sandbox.files.write(path, content);
            return 'File saved successfully';
          },
          schema: z.object({
            path: z.string().describe('The file path'),
            content: z.string().describe('The file content'),
          }),
        }),
        createTool({
          name: 'read_file',
          description: 'Read the content of a file',
          handler: async ({ path }, { step }) => {
            const sandbox = await getSandbox(sandboxId);
            const content = await sandbox.files.read(path);
            return content;
          },
          schema: z.object({
            path: z.string().describe('The file path to read'),
          }),
        }),
      ],
    });

    const network = createNetwork([codeAgent]);

    const result = await step.run('run-agent', async () => {
      return await network.run({
        input: {
          lastMessage: {
            role: 'user',
            content: event.data.value,
            type: 'text',
          },
        },
        state,
      });
    });

    const savedMessage = await step.run('save-message', async () => {
      const content = lastAssistantTextMessageContent(result);
      if (!content) return null;

      return await prisma.message.create({
        data: {
          content: content,
          role: 'ASSISTANT',
          type: 'RESULT',
          projectId: event.data.projectId,
          fragments: {
            create: Object.entries(result.state.files).map(([path, content]) => ({
              path,
              content,
            })),
          },
        },
      });
    });

    await step.sendEvent('publish-stream-result', {
      name: 'stream/result',
      data: {
        type: 'result',
        projectId: event.data.projectId,
        message: lastAssistantTextMessageContent(result),
        files: result.state.files,
        sandboxId: sandboxId,
      },
    });

    return {
      files: result.state.data.files,
      summary: result.state.data.summary,
      fragment: savedMessage?.fragment,
    };
  },
);
