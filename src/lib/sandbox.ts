import { Sandbox } from '@e2b/code-interpreter';
import { AgentResult, TextMessage } from '@inngest/agent-kit';
import { SANDBOX_TIMEOUT_MS, SANDBOX_TEMPLATE } from '@/constants/sandbox';

export const createSandbox = async () => {
  console.log(`[Sandbox] Creating new E2B sandbox with template: ${SANDBOX_TEMPLATE}`);
  console.log(`[Sandbox] Sandbox timeout: ${SANDBOX_TIMEOUT_MS}ms (${SANDBOX_TIMEOUT_MS / 1000 / 60} minutes)`);
  
  // Check if E2B API key is configured
  const e2bApiKey = process.env.E2B_API_KEY;
  console.log(`[Sandbox] E2B API key configured: ${!!e2bApiKey}`);
  
  if (!e2bApiKey) {
    const error = new Error('E2B_API_KEY environment variable is not configured');
    console.error('[Sandbox] Missing E2B API key configuration');
    throw error;
  }
  
  try {
    const sandbox = await Sandbox.create(SANDBOX_TEMPLATE);
    console.log(`[Sandbox] E2B sandbox created successfully with ID: ${sandbox.sandboxId}`);
    
    await sandbox.setTimeout(SANDBOX_TIMEOUT_MS);
    console.log(`[Sandbox] Timeout set successfully for sandbox ${sandbox.sandboxId}`);
    
    return sandbox;
  } catch (error) {
    console.error('[Sandbox] Failed to create E2B sandbox:', error);
    console.error('[Sandbox] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      template: SANDBOX_TEMPLATE,
      timeout: SANDBOX_TIMEOUT_MS
    });
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
