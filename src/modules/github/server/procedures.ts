import { protectedProcedure, createTRPCRouter } from '@/trpc/init';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';
import { inngest } from '@/inngest/client';
import { 
  decryptToken, 
  createRepository as createGitHubRepo
} from '@/lib/github';

export const githubRouter = createTRPCRouter({
  // Get user's GitHub connection status
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    const connection = await prisma.gitHubConnection.findUnique({
      where: { userId: ctx.auth.userId },
      select: {
        id: true,
        githubUsername: true,
        avatarUrl: true,
        profileUrl: true,
        scope: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return connection;
  }),
  
  // Disconnect GitHub account
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // First, get all repositories linked to this connection
      const connection = await prisma.gitHubConnection.findUnique({
        where: { userId: ctx.auth.userId },
        include: {
          repositories: {
            include: {
              project: true,
            },
          },
        },
      });
      
      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'GitHub connection not found',
        });
      }
      
      // Delete the connection (this will cascade delete repositories due to foreign key)
      await prisma.gitHubConnection.delete({
        where: { userId: ctx.auth.userId },
      });
      
      return { success: true, message: 'GitHub account disconnected successfully' };
    } catch (error) {
      console.error('GitHub disconnect error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to disconnect GitHub account',
      });
    }
  }),
  
  // Create a new repository for a project using all files from sandbox
  createRepository: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'Project ID is required'),
        name: z.string().min(1, 'Repository name is required'),
        description: z.string().optional(),
        isPrivate: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Import the projects router to use createGitHubRepoWithFullProject
      const { projectsRouter } = await import('@/modules/projects/server/procedures');
      
      try {
        // Use the new createGitHubRepoWithFullProject function that collects all files from sandbox
        const result = await projectsRouter.createCaller(ctx).createGitHubRepoWithFullProject({
          projectId: input.projectId,
          repositoryName: input.name,
          description: input.description,
          isPrivate: input.isPrivate,
        });
        
        return result.repository;
        
      } catch (error) {
        console.error('GitHub repository creation error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        // Handle GitHub API specific errors
        if (error && typeof error === 'object' && 'status' in error) {
          if (error.status === 422) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Repository name already exists or is invalid',
            });
          }
          if (error.status === 403) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Insufficient permissions to create repository',
            });
          }
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create GitHub repository',
        });
      }
    }),
    
  // Get repositories for a project or all repositories
  getRepositories: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const where: any = {
        githubConnection: {
          userId: ctx.auth.userId,
        },
      };
      
      if (input.projectId) {
        where.projectId = input.projectId;
      }
      
      const repositories = await prisma.gitHubRepository.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      return repositories;
    }),
    
  // Get repository by project ID
  getRepositoryByProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'Project ID is required'),
      })
    )
    .query(async ({ input, ctx }) => {
      const repository = await prisma.gitHubRepository.findFirst({
        where: {
          projectId: input.projectId,
          githubConnection: {
            userId: ctx.auth.userId,
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
      
      return repository;
    }),
});