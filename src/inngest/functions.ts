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
import { createSandbox } from '@/lib/sandbox';
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
          name: 'installPackage',
          description: 'Install npm packages in the sandbox. Use this instead of running npm install manually when you need to add dependencies.',
          handler: async ({ packageName, isDev }, { step }) => {
            return await step?.run('installPackage', async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await installPackage(sandbox, packageName, isDev);
                return `Successfully installed ${packageName}${isDev ? ' as dev dependency' : ''}. Output: ${result.stdout}`;
              } catch (e) {
                return `Failed to install ${packageName}: ${e}`;
              }
            });
          },
          parameters: z.object({
            packageName: z.string().describe('The name of the npm package to install'),
            isDev: z.boolean().optional().describe('Whether to install as dev dependency'),
          }),
        }),
        createTool({
          name: 'uninstallPackage',
          description: 'Uninstall npm packages from the sandbox',
          handler: async ({ packageName }, { step }) => {
            return await step?.run('uninstallPackage', async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await uninstallPackage(sandbox, packageName);
                return `Successfully uninstalled ${packageName}. Output: ${result.stdout}`;
              } catch (e) {
                return `Failed to uninstall ${packageName}: ${e}`;
              }
            });
          },
          parameters: z.object({
            packageName: z.string().describe('The name of the npm package to uninstall'),
          }),
        }),
        createTool({
          name: 'getPackageJson',
          description: 'Read the current package.json file to see installed dependencies and scripts',
          handler: async ({}, { step }) => {
            return await step?.run('getPackageJson', async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const packageJson = await getPackageJson(sandbox);
                return JSON.stringify(packageJson, null, 2);
              } catch (e) {
                return `Failed to read package.json: ${e}`;
              }
            });
          },
          parameters: z.object({}),
        }),
        createTool({
          name: 'updatePackageJson',
          description: 'Update package.json with custom fields, scripts, or configuration',
          handler: async ({ updates }, { step }) => {
            return await step?.run('updatePackageJson', async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const updatedPackageJson = await updatePackageJson(sandbox, updates);
                return `Successfully updated package.json: ${JSON.stringify(updatedPackageJson, null, 2)}`;
              } catch (e) {
                return `Failed to update package.json: ${e}`;
              }
            });
          },
          parameters: z.object({
            updates: z.record(z.any()).describe('Object with the fields to update in package.json'),
          }),
        }),
        createTool({
          name: 'manageEnvFile',
          description: 'Create, read, or update environment variables in .env files',
          handler: async ({ action, envVars, varName, fileName }, { step }) => {
            return await step?.run('manageEnvFile', async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const envFileName = fileName || '.env';
                
                switch (action) {
                  case 'read':
                    const content = await readEnvFile(sandbox, envFileName);
                    return content || `${envFileName} is empty or doesn't exist`;
                  
                  case 'update':
                    if (!envVars) {
                      return 'Error: envVars is required for update action';
                    }
                    const updatedContent = await updateEnvFile(sandbox, envVars, envFileName);
                    return `Successfully updated ${envFileName}:\n${updatedContent}`;
                  
                  case 'delete':
                    if (!varName) {
                      return 'Error: varName is required for delete action';
                    }
                    const newContent = await deleteEnvVar(sandbox, varName, envFileName);
                    return `Successfully deleted ${varName} from ${envFileName}:\n${newContent}`;
                  
                  default:
                    return 'Invalid action. Use: read, update, or delete';
                }
              } catch (e) {
                return `Failed to manage env file: ${e}`;
              }
            });
          },
          parameters: z.object({
            action: z.enum(['read', 'update', 'delete']).describe('Action to perform: read, update, or delete'),
            envVars: z.record(z.string()).optional().describe('Environment variables to set (for update action)'),
            varName: z.string().optional().describe('Variable name to delete (for delete action)'),
            fileName: z.string().optional().describe('Env file name (defaults to .env)'),
          }),
        }),
        createTool({
          name: 'exploreFileSystem',
          description: 'Explore the complete file system structure of the sandbox, list files, and understand the project layout',
          handler: async ({ action, directory }, { step }) => {
            return await step?.run('exploreFileSystem', async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const targetDir = directory || '/home/user';
                
                switch (action) {
                  case 'structure':
                    const structure = await getDirectoryStructure(sandbox, targetDir);
                    return `Directory structure of ${targetDir}:\n${structure}`;
                  
                  case 'listFiles':
                    const files = await listFiles(sandbox, targetDir);
                    return `Files in ${targetDir}:\n${files.join('\n')}`;
                  
                  case 'both':
                    const [struct, fileList] = await Promise.all([
                      getDirectoryStructure(sandbox, targetDir),
                      listFiles(sandbox, targetDir)
                    ]);
                    return `Directory structure:\n${struct}\n\nFile list:\n${fileList.join('\n')}`;
                  
                  default:
                    return 'Invalid action. Use: structure, listFiles, or both';
                }
              } catch (e) {
                return `Failed to explore file system: ${e}`;
              }
            });
          },
          parameters: z.object({
            action: z.enum(['structure', 'listFiles', 'both']).describe('What to explore: structure (tree view), listFiles (flat file list), or both'),
            directory: z.string().optional().describe('Directory to explore (defaults to /home/user)'),
          }),
        }),
        createTool({
          name: 'createOrUpdateFiles',
          description: 'Create or update any files in the sandbox, including configuration files, components, utilities, etc.',
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
