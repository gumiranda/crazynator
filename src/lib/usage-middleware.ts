import { subscriptionService } from './subscription-service';

export interface UsageLimitError extends Error {
  code: 'USAGE_LIMIT_EXCEEDED' | 'NO_SUBSCRIPTION' | 'INACTIVE_SUBSCRIPTION';
  resourceType: string;
  limit: number;
  current: number;
}

export class UsageLimitMiddleware {
  static async checkAndRecordUsage(
    userId: string,
    resourceType: string,
    amount: number = 1,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const canUse = await subscriptionService.checkUsageLimit(userId, resourceType);
      
      if (!canUse) {
        const subscription = await subscriptionService.getUserSubscription(userId);
        
        if (!subscription) {
          const error = new Error('No active subscription found') as UsageLimitError;
          error.code = 'NO_SUBSCRIPTION';
          error.resourceType = resourceType;
          error.limit = 0;
          error.current = 0;
          throw error;
        }

        if (subscription.status !== 'ACTIVE') {
          const error = new Error('Subscription is not active') as UsageLimitError;
          error.code = 'INACTIVE_SUBSCRIPTION';
          error.resourceType = resourceType;
          error.limit = 0;
          error.current = 0;
          throw error;
        }

        const usageInfo = await subscriptionService.getUsageInfo(userId);
        const currentResourceUsage = usageInfo.find(u => u.resourceType === resourceType);
        
        const error = new Error(`Usage limit exceeded for ${resourceType}`) as UsageLimitError;
        error.code = 'USAGE_LIMIT_EXCEEDED';
        error.resourceType = resourceType;
        error.limit = currentResourceUsage?.limit || 0;
        error.current = currentResourceUsage?.used || 0;
        throw error;
      }

      // Record the usage
      await subscriptionService.recordUsage(userId, resourceType, amount, metadata);
    } catch (error) {
      console.error('Error in usage limit middleware:', error);
      throw error;
    }
  }

  static async preflightCheck(userId: string, resourceType: string): Promise<boolean> {
    try {
      return await subscriptionService.checkUsageLimit(userId, resourceType);
    } catch (error) {
      console.error('Error in preflight check:', error);
      return false;
    }
  }

  static async getUserLimits(userId: string) {
    try {
      const subscription = await subscriptionService.getUserSubscription(userId);
      const usageInfo = await subscriptionService.getUsageInfo(userId);

      return {
        subscription,
        usage: usageInfo,
        hasActiveSubscription: subscription?.status === 'ACTIVE',
      };
    } catch (error) {
      console.error('Error getting user limits:', error);
      return {
        subscription: null,
        usage: [],
        hasActiveSubscription: false,
      };
    }
  }

  static createUsageLimitError(
    message: string,
    code: UsageLimitError['code'],
    resourceType: string,
    limit: number = 0,
    current: number = 0
  ): UsageLimitError {
    const error = new Error(message) as UsageLimitError;
    error.code = code;
    error.resourceType = resourceType;
    error.limit = limit;
    error.current = current;
    return error;
  }

  static isUsageLimitError(error: any): error is UsageLimitError {
    return error && typeof error.code === 'string' && 
           ['USAGE_LIMIT_EXCEEDED', 'NO_SUBSCRIPTION', 'INACTIVE_SUBSCRIPTION'].includes(error.code);
  }
}

export const usageMiddleware = UsageLimitMiddleware;