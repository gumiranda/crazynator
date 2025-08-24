import { Sandbox } from '@e2b/code-interpreter';
import { AgentResult, TextMessage } from '@inngest/agent-kit';
import { SANDBOX_TIMEOUT_MS, SANDBOX_TEMPLATE } from '@/constants/sandbox';

export const createSandbox = async () => {
  // Check if E2B API key is configured
  const e2bApiKey = process.env.E2B_API_KEY;
  
  if (!e2bApiKey) {
    throw new Error('E2B_API_KEY environment variable is not configured');
  }
  
  try {
    const sandbox = await Sandbox.create(SANDBOX_TEMPLATE);
    await sandbox.setTimeout(SANDBOX_TIMEOUT_MS);
    return sandbox;
  } catch (error) {
    throw error;
  }
};

export const getSandbox = async (sandboxId: string) => {
  const sandbox = await Sandbox.connect(sandboxId);
  await sandbox.setTimeout(SANDBOX_TIMEOUT_MS);
  return sandbox;
};

export const getLastAssistantTextMessageContent = (result: AgentResult) => {
  const lastAssistantMessageIndex = result.output.findLastIndex(
    (message) => message.role === 'assistant',
  );

  const message = result.output[lastAssistantMessageIndex] as TextMessage | undefined;

  return message?.content
    ? typeof message.content === 'string'
      ? message.content
      : message.content.map((c) => c.text).join('')
    : undefined;
};
