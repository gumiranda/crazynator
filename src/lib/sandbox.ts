import { Sandbox } from '@e2b/code-interpreter';
import { AgentResult, TextMessage } from '@inngest/agent-kit';
import { SANDBOX_TIMEOUT_MS, SANDBOX_TEMPLATE } from '@/constants/sandbox';

export async function createSandbox() {
  const sandbox = await Sandbox.create('crazystack');
  return sandbox;
}

export async function createSandboxWithCodegen() {
  // Usar o novo template com sistema de geração de código
  const sandbox = await Sandbox.create('crazystack-codegen');
  return sandbox;
}

export async function getSandbox() {
  // Implementar lógica para obter sandbox existente
  return null;
}

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
