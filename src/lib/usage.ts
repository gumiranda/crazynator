'server-only';

import { auth } from '@clerk/nextjs/server';
import { RateLimiterPrisma } from 'rate-limiter-flexible';
import { prisma } from '@/lib/prisma';

const FREE_POINTS = 5;
const FREE_DURATION = 30 * 24 * 60 * 60; // 30 days
const POINTS_PER_REQUEST = 1;

export async function getUsageTracker() {
  const usageTracker = new RateLimiterPrisma({
    storeClient: prisma,
    tableName: 'Usage',
    points: FREE_POINTS,
    duration: FREE_DURATION,
  });

  return usageTracker;
}

export async function consumeCredits() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const usageTracker = await getUsageTracker();
  const result = await usageTracker.consume(userId, POINTS_PER_REQUEST);
  return result;
}

export async function getUsageStatus() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const usageTracker = await getUsageTracker();
  const result = await usageTracker.get(userId);
  return result;
}
