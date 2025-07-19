import { prisma } from '@/lib/db';

export interface UserAIConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
}

export async function getUserAIConfig(userId: string): Promise<UserAIConfig> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    // Use default OpenAI settings if no user settings exist
    const defaultApiKey = process.env.OPENAI_API_KEY;
    if (!defaultApiKey) {
      throw new Error('No API key configured. Please configure your AI settings.');
    }
    return {
      provider: 'openai',
      apiKey: defaultApiKey,
      model: 'gpt-4o',
    };
  }

  const { preferredProvider, openaiApiKey, anthropicApiKey, openaiModel, anthropicModel } = settings;

  if (preferredProvider === 'anthropic') {
    const apiKey = anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured. Please add your Anthropic API key in settings.');
    }
    return {
      provider: 'anthropic',
      apiKey,
      model: anthropicModel,
    };
  } else {
    const apiKey = openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please add your OpenAI API key in settings.');
    }
    return {
      provider: 'openai',
      apiKey,
      model: openaiModel,
    };
  }
}

export function createAIModelConfig(config: UserAIConfig) {
  if (config.provider === 'anthropic') {
    return {
      type: 'anthropic' as const,
      model: config.model,
      apiKey: config.apiKey,
      defaultParameters: { temperature: 0.1 },
    };
  } else {
    return {
      type: 'openai' as const,
      model: config.model,
      apiKey: config.apiKey,
      defaultParameters: { temperature: 0.1 },
    };
  }
}