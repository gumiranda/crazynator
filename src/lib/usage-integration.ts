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
    return limits;
  } catch (error) {
    console.error('Error getting usage status:', error);
    return {
      subscription: null,
      usage: [],
      hasActiveSubscription: false,
    };
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