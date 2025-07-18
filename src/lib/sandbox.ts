import { Sandbox } from '@e2b/code-interpreter';
import { AgentResult, TextMessage } from '@inngest/agent-kit';
import { SANDBOX_TIMEOUT_MS, SANDBOX_TEMPLATE } from '@/constants/sandbox';

export const createSandbox = async () => {
  const sandbox = await Sandbox.create(SANDBOX_TEMPLATE);
  await sandbox.setTimeout(SANDBOX_TIMEOUT_MS);
  return sandbox;
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
