import { inngest } from './client';
import {
  createAgent,
  createNetwork,
  createTool,
  openai,
  type Tool,
  type Message,
  createState,
  anthropic,
} from '@inngest/agent-kit';
import { getSandbox, lastAssistantTextMessageContent } from './utils';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from '@/constants/prompt';
import { createSandbox } from '@/lib/sandbox';

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

const formatMessageWithImages = (content: string, images?: string[]): Message => {
  if (!images || images.length === 0) {
    return {
      role: 'user',
      content: content,
      type: 'text',
    };
  }

  // Convert relative URLs to absolute URLs for the agent
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const imageContents = images.map((imageUrl) => ({
    type: 'image' as const,
    image: imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`,
  }));

  return {
    role: 'user',
    content: [
      {
        type: 'text' as const,
        text: content || 'Please analyze the provided image(s) and help me with any coding or development tasks based on what you see.',
      },
      ...imageContents,
    ],
    type: 'multimodal' as const,
  };
};

export const codeAgentFunction = inngest.createFunction(
  { id: 'code-agent' },
  { event: 'code-agent/run' },
  async ({ event, step }) => {
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
        if (message.role === 'USER') {
          // Handle user messages with potential images
          const images = message.images as string[] | undefined;
          formattedMessages.push(formatMessageWithImages(message.content, images));
        } else {
          // Handle assistant messages (text only)
          formattedMessages.push({
            role: 'assistant',
            content: message.content,
            type: 'text',
          });
        }
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
      description: 'You are an expert code agent with vision capabilities. You can analyze images, screenshots, and visual content to help with coding tasks.',
      system: `${PROMPT}

ADDITIONAL CAPABILITIES:
- You can analyze images, screenshots, UI mockups, diagrams, and other visual content
- When provided with images, examine them carefully to understand the context and requirements
- Use visual information to inform your coding decisions and implementation
- If you see a UI mockup or design, implement it accurately
- If you see an error screenshot, help debug and fix the issue
- If you see a diagram or flowchart, implement the logic it describes
- Always describe what you see in images before proceeding with code implementation`,
      model: anthropic({
        model: 'claude-opus-4-20250514',
        defaultParameters: { temperature: 0.1, max_tokens: 8000 },
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

    // Create the initial message for the current request, including images if present
    const currentMessage = formatMessageWithImages(event.data.value, event.data.images);
    
    const result = await network.run(currentMessage, {
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
