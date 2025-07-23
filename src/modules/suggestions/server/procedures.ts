import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { CodeAnalysisService } from '@/lib/services/code-analysis.service';
import { SuggestionEngineService } from '@/lib/services/suggestion-engine.service';
import { PatternDetectionService } from '@/lib/services/pattern-detection.service';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();
const codeAnalysisService = new CodeAnalysisService();
const suggestionEngineService = new SuggestionEngineService();
const patternDetectionService = new PatternDetectionService();

export const suggestionsRouter = createTRPCRouter({
  // Get all suggestions for a project
  getAll: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        filters: z
          .object({
            category: z.enum([
              'ATOMIC_DESIGN',
              'FEATURE_SLICED_DESIGN',
              'REACT_QUERY',
              'ZUSTAND',
              'REACT_PATTERNS',
              'TYPESCRIPT_PATTERNS',
              'PERFORMANCE_OPTIMIZATION',
              'ACCESSIBILITY_IMPROVEMENT',
              'TESTING_STRATEGY',
            ]).optional(),
            type: z.enum([
              'ARCHITECTURE',
              'COMPONENT_STRUCTURE',
              'STATE_MANAGEMENT',
              'DATA_FETCHING',
              'PERFORMANCE',
              'ACCESSIBILITY',
              'TESTING',
              'TYPESCRIPT',
            ]).optional(),
            severity: z.enum(['INFO', 'WARNING', 'ERROR']).optional(),
            status: z.enum(['PENDING', 'DISMISSED', 'APPLIED', 'EXPIRED']).optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.userId,
        },
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      return suggestionEngineService.getSuggestions(input.projectId, input.filters);
    }),

  // Analyze project and generate suggestions
  analyze: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.userId,
        },
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      try {
        // Analyze the project
        const analysisResult = await codeAnalysisService.analyzeProject(input.projectId);

        // Get user preferences
        const userPreferences = await prisma.userPreference.findMany({
          where: { userId: ctx.userId },
        });

        // Generate suggestions
        const suggestions = await suggestionEngineService.generateSuggestions(
          analysisResult,
          userPreferences
        );

        return {
          success: true,
          analysisResult,
          suggestions: suggestions.length,
          message: `Analysis complete. Generated ${suggestions.length} suggestions.`,
        };
      } catch (error) {
        console.error('Analysis failed:', error);
        throw new Error(`Analysis failed: ${error.message}`);
      }
    }),

  // Apply a specific suggestion
  apply: protectedProcedure
    .input(z.object({ suggestionId: z.string(), projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.userId,
        },
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      try {
        const result = await suggestionEngineService.applySuggestion(
          input.suggestionId,
          input.projectId
        );

        return result;
      } catch (error) {
        console.error('Failed to apply suggestion:', error);
        throw new Error(`Failed to apply suggestion: ${error.message}`);
      }
    }),

  // Dismiss a suggestion
  dismiss: protectedProcedure
    .input(z.object({ suggestionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verify suggestion ownership through project
      const suggestion = await prisma.codeSuggestion.findFirst({
        where: {
          id: input.suggestionId,
          project: {
            userId: ctx.userId,
          },
        },
      });

      if (!suggestion) {
        throw new Error('Suggestion not found or access denied');
      }

      await suggestionEngineService.dismissSuggestion(input.suggestionId);

      return { success: true, message: 'Suggestion dismissed' };
    }),

  // Get suggestion details
  getById: protectedProcedure
    .input(z.object({ suggestionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const suggestion = await prisma.codeSuggestion.findFirst({
        where: {
          id: input.suggestionId,
          project: {
            userId: ctx.userId,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!suggestion) {
        throw new Error('Suggestion not found or access denied');
      }

      return suggestion;
    }),

  // Get project analysis metrics
  getAnalysisMetrics: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.userId,
        },
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      try {
        const metrics = await codeAnalysisService.getCodeMetrics(input.projectId);
        
        // Get suggestion counts by category and severity
        const suggestionCounts = await prisma.codeSuggestion.groupBy({
          by: ['category', 'severity', 'status'],
          where: { projectId: input.projectId },
          _count: true,
        });

        return {
          metrics,
          suggestionCounts,
        };
      } catch (error) {
        console.error('Failed to get analysis metrics:', error);
        throw new Error(`Failed to get analysis metrics: ${error.message}`);
      }
    }),

  // Update user preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        preferences: z.array(
          z.object({
            category: z.enum([
              'ATOMIC_DESIGN',
              'FEATURE_SLICED_DESIGN',
              'REACT_QUERY',
              'ZUSTAND',
              'REACT_PATTERNS',
              'TYPESCRIPT_PATTERNS',
              'PERFORMANCE_OPTIMIZATION',
              'ACCESSIBILITY_IMPROVEMENT',
              'TESTING_STRATEGY',
            ]),
            enabled: z.boolean(),
            frequency: z.enum(['MINIMAL', 'NORMAL', 'AGGRESSIVE']),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Update or create preferences
        const updatedPreferences = [];

        for (const pref of input.preferences) {
          const preference = await prisma.userPreference.upsert({
            where: {
              userId_category: {
                userId: ctx.userId,
                category: pref.category,
              },
            },
            update: {
              enabled: pref.enabled,
              frequency: pref.frequency,
            },
            create: {
              userId: ctx.userId,
              category: pref.category,
              enabled: pref.enabled,
              frequency: pref.frequency,
            },
          });

          updatedPreferences.push(preference);
        }

        return {
          success: true,
          preferences: updatedPreferences,
          message: 'Preferences updated successfully',
        };
      } catch (error) {
        console.error('Failed to update preferences:', error);
        throw new Error(`Failed to update preferences: ${error.message}`);
      }
    }),

  // Get user preferences
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const preferences = await prisma.userPreference.findMany({
        where: { userId: ctx.userId },
      });

      // If no preferences exist, return defaults
      if (preferences.length === 0) {
        const defaultCategories = [
          'ATOMIC_DESIGN',
          'FEATURE_SLICED_DESIGN',
          'REACT_QUERY',
          'ZUSTAND',
          'REACT_PATTERNS',
          'TYPESCRIPT_PATTERNS',
          'PERFORMANCE_OPTIMIZATION',
          'ACCESSIBILITY_IMPROVEMENT',
          'TESTING_STRATEGY',
        ] as const;

        return defaultCategories.map(category => ({
          category,
          enabled: true,
          frequency: 'NORMAL' as const,
        }));
      }

      return preferences;
    }),

  // Bulk dismiss suggestions
  bulkDismiss: protectedProcedure
    .input(
      z.object({
        suggestionIds: z.array(z.string()),
        projectId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.userId,
        },
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      try {
        await prisma.codeSuggestion.updateMany({
          where: {
            id: { in: input.suggestionIds },
            projectId: input.projectId,
          },
          data: {
            status: 'DISMISSED',
            dismissedAt: new Date(),
          },
        });

        return {
          success: true,
          dismissed: input.suggestionIds.length,
          message: `Dismissed ${input.suggestionIds.length} suggestions`,
        };
      } catch (error) {
        console.error('Failed to bulk dismiss suggestions:', error);
        throw new Error(`Failed to bulk dismiss suggestions: ${error.message}`);
      }
    }),

  // Get suggestion statistics
  getStatistics: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.userId,
        },
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      const [totalSuggestions, pendingSuggestions, appliedSuggestions, dismissedSuggestions] = 
        await Promise.all([
          prisma.codeSuggestion.count({
            where: { projectId: input.projectId },
          }),
          prisma.codeSuggestion.count({
            where: { projectId: input.projectId, status: 'PENDING' },
          }),
          prisma.codeSuggestion.count({
            where: { projectId: input.projectId, status: 'APPLIED' },
          }),
          prisma.codeSuggestion.count({
            where: { projectId: input.projectId, status: 'DISMISSED' },
          }),
        ]);

      const categoryBreakdown = await prisma.codeSuggestion.groupBy({
        by: ['category'],
        where: { projectId: input.projectId },
        _count: true,
      });

      const severityBreakdown = await prisma.codeSuggestion.groupBy({
        by: ['severity'],
        where: { projectId: input.projectId },
        _count: true,
      });

      return {
        total: totalSuggestions,
        pending: pendingSuggestions,
        applied: appliedSuggestions,
        dismissed: dismissedSuggestions,
        categoryBreakdown: categoryBreakdown.map(item => ({
          category: item.category,
          count: item._count,
        })),
        severityBreakdown: severityBreakdown.map(item => ({
          severity: item.severity,
          count: item._count,
        })),
      };
    }),

  // Search suggestions
  search: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        query: z.string(),
        filters: z
          .object({
            category: z.string().optional(),
            severity: z.string().optional(),
            status: z.string().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.userId,
        },
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      const where: any = {
        projectId: input.projectId,
        OR: [
          { title: { contains: input.query, mode: 'insensitive' } },
          { description: { contains: input.query, mode: 'insensitive' } },
        ],
      };

      if (input.filters?.category) {
        where.category = input.filters.category;
      }
      if (input.filters?.severity) {
        where.severity = input.filters.severity;
      }
      if (input.filters?.status) {
        where.status = input.filters.status;
      }

      const suggestions = await prisma.codeSuggestion.findMany({
        where,
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 50, // Limit results
      });

      return suggestions;
    }),
});