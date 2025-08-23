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
  
  // Create a new repository for a project
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
      try {
        // Check if user has a GitHub connection
        const connection = await prisma.gitHubConnection.findUnique({
          where: { userId: ctx.auth.userId },
        });
        
        if (!connection) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'GitHub account not connected',
          });
        }
        
        // Check if project exists and belongs to user
        const project = await prisma.project.findFirst({
          where: {
            id: input.projectId,
            userId: ctx.auth.userId,
          },
          include: {
            githubRepository: true,
            messages: {
              include: {
                fragment: true,
              },
            },
          },
        });
        
        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }
        
        // Check if project already has a GitHub repository
        if (project.githubRepository) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Project already has a GitHub repository',
          });
        }
        
        // Decrypt access token
        const accessToken = decryptToken(connection.accessToken);
        
        // Create repository on GitHub
        const githubRepo = await createGitHubRepo(accessToken, {
          name: input.name,
          description: input.description,
          private: input.isPrivate,
          auto_init: true,
        });
        
        // Store repository in database
        const dbRepository = await prisma.gitHubRepository.create({
          data: {
            projectId: input.projectId,
            githubConnectionId: connection.id,
            githubRepoId: githubRepo.id,
            name: githubRepo.name,
            fullName: githubRepo.full_name,
            description: githubRepo.description,
            isPrivate: githubRepo.private,
            defaultBranch: githubRepo.default_branch,
            htmlUrl: githubRepo.html_url,
            cloneUrl: githubRepo.clone_url,
            syncStatus: 'PENDING',
          },
        });
        
        // Trigger initial sync using background job
        try {
          await inngest.send({
            name: 'github/initial-sync',
            data: {
              repositoryId: dbRepository.id,
            },
          });
        } catch (syncError) {
          console.error('Failed to trigger initial sync:', syncError);
          // Update sync status to failed
          await prisma.gitHubRepository.update({
            where: { id: dbRepository.id },
            data: {
              syncStatus: 'FAILED',
              syncError: syncError instanceof Error ? syncError.message : 'Failed to trigger sync',
            },
          });
        }
        
        return {
          id: dbRepository.id,
          name: githubRepo.name,
          fullName: githubRepo.full_name,
          htmlUrl: githubRepo.html_url,
          isPrivate: githubRepo.private,
          syncStatus: dbRepository.syncStatus,
        };
        
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