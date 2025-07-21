'server-only';

import { auth } from '@clerk/nextjs/server';
import { usageMiddleware } from './usage-middleware';

export async function consumeCreditsWithStripe() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    await usageMiddleware.checkAndRecordUsage(userId, 'apiCalls', 1, {
      source: 'code_generation',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (usageMiddleware.isUsageLimitError(error)) {
      throw error; // Re-throw usage limit errors
    }
    console.error('Error consuming credits:', error);
    throw new Error('Failed to consume credits');
  }
}

export async function getUsageStatusWithStripe() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const limits = await usageMiddleware.getUserLimits(userId);
    
    if (!limits.hasActiveSubscription || !limits.subscription) {
      return null; // No subscription, UI won't show usage
    }

    // Encontrar usage de API calls
    const apiCallsUsage = limits.usage.find(u => u.resourceType === 'apiCalls');
    
    if (!apiCallsUsage) {
      return null;
    }

    const remainingPoints = Math.max(0, apiCallsUsage.limit - apiCallsUsage.used);
    
    // Calcular próximo reset (fim do mês atual)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const msBeforeNext = nextMonth.getTime() - now.getTime();

    return {
      remainingPoints,
      msBeforeNext,
      subscription: limits.subscription,
      usage: limits.usage,
      hasActiveSubscription: limits.hasActiveSubscription,
    };
  } catch (error) {
    console.error('Error getting usage status:', error);
    return null;
  }
}

export async function checkCanCreateProject() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    return await usageMiddleware.preflightCheck(userId, 'projects');
  } catch (error) {
    console.error('Error checking project creation:', error);
    return false;
  }
}

export async function recordProjectCreation() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    await usageMiddleware.checkAndRecordUsage(userId, 'projects', 1, {
      source: 'project_creation',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (usageMiddleware.isUsageLimitError(error)) {
      throw error; // Re-throw usage limit errors
    }
    console.error('Error recording project creation:', error);
    throw new Error('Failed to record project creation');
  }
}