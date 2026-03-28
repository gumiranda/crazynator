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
import { buildPrompt, FRAGMENT_TITLE_PROMPT, RESPONSE_PROMPT } from '@/constants/prompt';
import { createSandbox } from '@/lib/sandbox';
import { prisma } from '@/lib/prisma';
import { generateUILibraryPromptContext, getInstallCommand } from '@/constants/ui-libraries';
import {
  findTemplate,
  generateFromTemplate,
  generateTemplatePromptContext,
} from '@/lib/plop-templates';
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
        formattedMessages.push({
          role: message.role === 'USER' ? 'user' : 'assistant',
          content: message.content,
          type: 'text',
        });
      }
      return formattedMessages.reverse();
    });
    // Fetch project configuration for dynamic prompt building
    const projectConfig = await step.run('get-project-config', async () => {
      const project = await prisma.project.findUnique({
        where: { id: event.data.projectId },
        select: { uiLibraries: true, envVariables: true, sandboxConfig: true },
      });
      return {
        uiLibraries: (project?.uiLibraries as string[]) || [],
        envVariables: (project?.envVariables as Record<string, string>) || {},
        sandboxConfig: project?.sandboxConfig as Record<string, unknown> | null,
      };
    });

    // Build dynamic prompt with only relevant context (saves tokens!)
    const dynamicPrompt = buildPrompt({
      uiLibraryContext: generateUILibraryPromptContext(projectConfig.uiLibraries),
      templateContext: generateTemplatePromptContext(projectConfig.uiLibraries),
      envVariables: projectConfig.envVariables,
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

    // Install UI library dependencies in sandbox if configured
    if (projectConfig.uiLibraries.length > 0) {
      await step.run('install-ui-libs', async () => {
        const installCmd = getInstallCommand(projectConfig.uiLibraries);
        if (installCmd) {
          const sandbox = await getSandbox(sandboxId);
          await sandbox.commands.run(installCmd);
        }
      });
    }

    // Write env variables to sandbox if configured
    if (Object.keys(projectConfig.envVariables).length > 0) {
      await step.run('write-env-vars', async () => {
        const sandbox = await getSandbox(sandboxId);
        const envContent = Object.entries(projectConfig.envVariables)
          .map(([key, value]) => `${key}=${value}`)
          .join('\n');
        await sandbox.files.write('.env.local', envContent);
      });
    }

    const codeAgent = createAgent<AgentState>({
      name: 'code-agent',
      description: 'You are an expert code agent.',
      system: dynamicPrompt,
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
        // TOKEN-SAVING: Template tool generates files from pre-built templates
        createTool({
          name: 'useTemplate',
          description:
            'Generate files from a pre-built template. ALWAYS prefer this over writing boilerplate from scratch to save tokens. Available templates: dashboard-layout, landing-page, auth-page, crud-table, settings-page',
          parameters: z.object({
            templateName: z.string().describe('Name of the template to use'),
            variables: z
              .record(z.union([z.string(), z.boolean(), z.array(z.string())]))
              .describe('Template variables to fill in'),
          }),
          handler: async (
            { templateName, variables },
            { step, network }: Tool.Options<AgentState>,
          ) => {
            const newFiles = await step?.run('useTemplate', async () => {
              const template = findTemplate(templateName);
              if (!template) {
                return `Template "${templateName}" not found. Available: dashboard-layout, landing-page, auth-page, crud-table, settings-page`;
              }

              const generatedFiles = generateFromTemplate(template, variables);
              const updatedFiles = network.state.data.files || {};
              const sandbox = await getSandbox(sandboxId);

              for (const file of generatedFiles) {
                await sandbox.files.write(file.path, file.content);
                updatedFiles[file.path] = file.content;
              }

              return updatedFiles;
            });
            if (typeof newFiles === 'object') {
              network.state.data.files = newFiles as { [path: string]: string };
            }
            return `Template "${templateName}" applied successfully. Generated ${Object.keys(newFiles || {}).length} files.`;
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
