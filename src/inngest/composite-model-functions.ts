import { inngest } from './client';
import {
  createAgent,
  createTool,
  openai,
  type Tool,
  type Message,
  createState,
} from '@inngest/agent-kit';
import { getSandbox, lastAssistantTextMessageContent } from './utils';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { FRAGMENT_TITLE_PROMPT, RESPONSE_PROMPT } from '@/constants/prompt';
import { createSandbox } from '@/lib/sandbox';
import { projectChannel } from './channels';
import { CompositeModelFamily } from '@/lib/models/composite-models';
import { ModelContext } from '@/lib/models/types';

interface AgentState {
  summary: string;
  files: { [path: string]: string };
  modelUsed: string;
  ragEnabled: boolean;
  postProcessed: boolean;
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

/**
 * Composite Model Agent Function using v0-1.5-md
 */
export const compositeModelMdFunction = inngest.createFunction(
  { id: 'composite-model-md' },
  { event: 'composite-model/md' },
  async ({ event, step, publish }) => {
    return await executeCompositeModelFunction(event, step, publish, 'v0-1.5-md');
  }
);

/**
 * Composite Model Agent Function using v0-1.5-lg
 */
export const compositeModelLgFunction = inngest.createFunction(
  { id: 'composite-model-lg' },
  { event: 'composite-model/lg' },
  async ({ event, step, publish }) => {
    return await executeCompositeModelFunction(event, step, publish, 'v0-1.5-lg');
  }
);

/**
 * Smart Model Selection Function - automatically chooses the best model
 */
export const smartModelSelectionFunction = inngest.createFunction(
  { id: 'smart-model-selection' },
  { event: 'composite-model/smart' },
  async ({ event, step, publish }) => {
    const compositeFamily = CompositeModelFamily.getInstance();
    
    // Analyze the task to recommend the best model
    const recommendedModel = await step.run('recommend-model', async () => {
      const taskAnalysis = analyzeTask(event.data.value);
      return compositeFamily.recommendModel(taskAnalysis.type);
    });

    return await executeCompositeModelFunction(event, step, publish, recommendedModel);
  }
);

/**
 * Core execution function for composite models
 */
async function executeCompositeModelFunction(
  event: any,
  step: any,
  publish: any,
  modelName: string
) {
  const compositeFamily = CompositeModelFamily.getInstance();

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
      take: 10, // Increased for better context
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

  // Generate response using composite model
  const compositeResponse = await step.run('composite-model-response', async () => {
    const context: ModelContext = {
      projectId: event.data.projectId,
      previousMessages,
      userQuery: event.data.value,
    };

    return await compositeFamily.generateResponse(modelName, context);
  });

  const state = createState<AgentState>(
    {
      summary: compositeResponse.content,
      files: {},
      modelUsed: modelName,
      ragEnabled: compositeResponse.metadata.ragEnabled,
      postProcessed: compositeResponse.metadata.postProcessed,
    },
    {
      messages: previousMessages,
    }
  );

  // If the response includes code generation, execute it in the sandbox
  const sandboxResult = await step.run('execute-in-sandbox', async () => {
    if (requiresSandboxExecution(compositeResponse.content)) {
      return await executeSandboxTasks(sandboxId, compositeResponse.content);
    }
    return { files: {}, executed: false };
  });

  // Merge sandbox files with state
  state.data.files = { ...state.data.files, ...sandboxResult.files };

  // Generate title and response using specialized agents
  const [fragmentTitleOutput, responseOutput] = await Promise.all([
    step.run('generate-title', async () => {
      const titleAgent = createAgent({
        name: 'title-generator',
        description: 'Generates short, descriptive titles for code fragments',
        system: FRAGMENT_TITLE_PROMPT,
        model: openai({
          model: 'gpt-4o-mini',
        }),
      });

      return await titleAgent.run(compositeResponse.content);
    }),
    
    step.run('generate-response', async () => {
      const responseAgent = createAgent({
        name: 'response-generator',
        description: 'Generates user-friendly response messages',
        system: RESPONSE_PROMPT,
        model: openai({
          model: 'gpt-4o-mini',
        }),
      });

      return await responseAgent.run(compositeResponse.content);
    }),
  ]);

  const isError = !compositeResponse.content || Object.keys(state.data.files).length === 0;

  const sandboxUrl = await step.run('get-sandbox-url', async () => {
    const sandbox = await getSandbox(sandboxId);
    const host = sandbox.getHost(3000);
    return `https://${host}`;
  });

  const savedMessage = await step.run('save-result', async () => {
    if (isError) {
      return await prisma.message.create({
        data: {
          content: 'Something went wrong with the composite model. Please try again.',
          role: 'ASSISTANT',
          type: 'ERROR',
          projectId: event.data.projectId,
        },
        include: {
          fragment: true,
        },
      });
    }

    const finalContent = compositeResponse.metadata.postProcessed 
      ? compositeResponse.content 
      : generatedAgentResponse(responseOutput.output, compositeResponse.content);

    return await prisma.message.create({
      data: {
        projectId: event.data.projectId,
        content: finalContent,
        role: 'ASSISTANT',
        type: 'RESULT',
        fragment: {
          create: {
            sandboxUrl,
            title: generatedAgentResponse(fragmentTitleOutput.output, `${modelName} Fragment`),
            files: state.data.files,
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
    title: savedMessage.fragment?.title || `${modelName} Fragment`,
    files: state.data.files,
    summary: compositeResponse.content,
    fragment: savedMessage.fragment,
    metadata: {
      modelUsed: modelName,
      ragEnabled: compositeResponse.metadata.ragEnabled,
      postProcessed: compositeResponse.metadata.postProcessed,
      processingTime: compositeResponse.metadata.processingTime,
      confidence: compositeResponse.metadata.confidence,
      ragContext: compositeResponse.ragContext?.length || 0,
    },
  };
}

/**
 * Analyze task type for model recommendation
 */
function analyzeTask(userQuery: string): { type: string; complexity: 'low' | 'medium' | 'high' } {
  const query = userQuery.toLowerCase();
  
  // Detect task type based on keywords
  if (query.includes('architecture') || query.includes('system design') || query.includes('scalability')) {
    return { type: 'complex architecture', complexity: 'high' };
  }
  
  if (query.includes('algorithm') || query.includes('optimization') || query.includes('performance')) {
    return { type: 'advanced algorithms', complexity: 'high' };
  }
  
  if (query.includes('review') || query.includes('refactor') || query.includes('improve')) {
    return { type: 'code review', complexity: 'medium' };
  }
  
  if (query.includes('debug') || query.includes('fix') || query.includes('error')) {
    return { type: 'debugging', complexity: 'medium' };
  }
  
  if (query.includes('create') || query.includes('build') || query.includes('generate')) {
    return { type: 'code generation', complexity: 'medium' };
  }
  
  // Default to code generation with medium complexity
  return { type: 'code generation', complexity: 'medium' };
}

/**
 * Check if the response requires sandbox execution
 */
function requiresSandboxExecution(content: string): boolean {
  const codeIndicators = [
    'createOrUpdateFiles',
    'terminal',
    'npm install',
    'package.json',
    'import ',
    'export ',
    'function ',
    'const ',
    'let ',
    'var ',
    'class ',
    'interface ',
  ];
  
  return codeIndicators.some(indicator => content.includes(indicator));
}

/**
 * Execute tasks in the sandbox based on the response content
 */
async function executeSandboxTasks(sandboxId: string, content: string): Promise<{ files: Record<string, string>; executed: boolean }> {
  try {
    const sandbox = await getSandbox(sandboxId);
    const files: Record<string, string> = {};

    // Extract and execute file creation tasks
    const fileMatches = content.match(/createOrUpdateFiles.*?files:\s*\[(.*?)\]/gs);
    if (fileMatches) {
      for (const match of fileMatches) {
        const fileObjects = extractFileObjects(match);
        for (const fileObj of fileObjects) {
          await sandbox.files.write(fileObj.path, fileObj.content);
          files[fileObj.path] = fileObj.content;
        }
      }
    }

    // Extract and execute terminal commands
    const terminalMatches = content.match(/terminal.*?command:\s*["'](.*?)["']/gs);
    if (terminalMatches) {
      for (const match of terminalMatches) {
        const command = match.match(/command:\s*["'](.*?)["']/)?.[1];
        if (command) {
          await sandbox.commands.run(command);
        }
      }
    }

    return { files, executed: true };
  } catch (error) {
    console.error('Error executing sandbox tasks:', error);
    return { files: {}, executed: false };
  }
}

/**
 * Extract file objects from tool call content
 */
function extractFileObjects(content: string): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];
  
  try {
    // This is a simplified parser - in production, you'd want a more robust solution
    const pathMatches = content.match(/path:\s*["'](.*?)["']/g);
    const contentMatches = content.match(/content:\s*["'](.*?)["']/gs);
    
    if (pathMatches && contentMatches && pathMatches.length === contentMatches.length) {
      for (let i = 0; i < pathMatches.length; i++) {
        const path = pathMatches[i].match(/path:\s*["'](.*?)["']/)?.[1];
        const content = contentMatches[i].match(/content:\s*["'](.*?)["']/s)?.[1];
        
        if (path && content) {
          files.push({ path, content });
        }
      }
    }
  } catch (error) {
    console.error('Error extracting file objects:', error);
  }
  
  return files;
}