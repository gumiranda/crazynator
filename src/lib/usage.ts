'server-only';

import { auth } from '@clerk/nextjs/server';
import { RateLimiterPrisma } from 'rate-limiter-flexible';
import { prisma } from '@/lib/prisma';
import { getCurrentUserPlan, PlanInfo } from '@/lib/services/subscription';

const POINTS_PER_REQUEST = 1;
const LOW_CREDITS_THRESHOLD = 0.2; // 20% threshold for warnings

export async function getUsageTracker(planInfo?: PlanInfo) {
  if (!planInfo) {
    planInfo = await getCurrentUserPlan();
  }

  const usageTracker = new RateLimiterPrisma({
    storeClient: prisma,
    tableName: 'Usage',
    points: planInfo.credits,
    duration: planInfo.duration,
  });

  return usageTracker;
}

export async function consumeCredits() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const planInfo = await getCurrentUserPlan();
  const usageTracker = await getUsageTracker(planInfo);
  const result = await usageTracker.consume(userId, POINTS_PER_REQUEST);
  return result;
}

export interface UsageStatus {
  remainingPoints: number;
  totalPointsUsed: number;
  msBeforeNext: number;
  plan: PlanInfo;
  isLowCredits: boolean;
  creditsPercentage: number;
}

export async function getUsageStatus(): Promise<UsageStatus> {
  const { userId } = await auth();
  console.log('🔍 [getUsageStatus] Called for userId:', userId);
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const planInfo = await getCurrentUserPlan();
  console.log('🔍 [getUsageStatus] Got plan info:', planInfo);
  
  const usageTracker = await getUsageTracker(planInfo);
  const result = await usageTracker.get(userId);
  
  const remainingPoints = result ? result.remainingPoints || 0 : planInfo.credits;
  const creditsPercentage = remainingPoints / planInfo.credits;
  const isLowCredits = creditsPercentage <= LOW_CREDITS_THRESHOLD;

  const usageStatus = {
    remainingPoints,
    totalPointsUsed: planInfo.credits - remainingPoints,
    msBeforeNext: result ? result.msBeforeNext : 0,
    plan: planInfo,
    isLowCredits,
    creditsPercentage
  };

  console.log('✅ [getUsageStatus] Returning usage status:', usageStatus);
  return usageStatus;
}

export async function checkCreditsAvailable(): Promise<boolean> {
  try {
    const status = await getUsageStatus();
    return status.remainingPoints > 0;
  } catch {
    return false;
  }
}

export async function validateCreditsBeforeAction(): Promise<UsageStatus> {
  const status = await getUsageStatus();
  
  if (status.remainingPoints <= 0) {
    throw new Error(`Credits exhausted for ${status.plan.displayName} plan. Please upgrade or wait for reset.`);
  }
  
  return status;
}
