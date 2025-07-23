import { atomicDesignRules } from './atomic-design';
import { featureSlicedDesignRules } from './feature-sliced-design';
import { stateManagementRules } from './state-management';
import { dataFetchingRules } from './data-fetching';
import { PatternRule } from '@/generated/prisma';

export const allPatternRules: Omit<PatternRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  ...atomicDesignRules,
  ...featureSlicedDesignRules,
  ...stateManagementRules,
  ...dataFetchingRules,
];

export {
  atomicDesignRules,
  featureSlicedDesignRules,
  stateManagementRules,
  dataFetchingRules,
};

// Helper function to get rules by category
export const getRulesByCategory = (category: string) => {
  return allPatternRules.filter(rule => rule.category === category);
};

// Helper function to get rules by type
export const getRulesByType = (type: string) => {
  return allPatternRules.filter(rule => rule.type === type);
};

// Helper function to get enabled rules only
export const getEnabledRules = () => {
  return allPatternRules.filter(rule => rule.enabled);
};

// Helper function to get rules by priority (higher priority first)
export const getRulesByPriority = () => {
  return [...allPatternRules].sort((a, b) => b.priority - a.priority);
};