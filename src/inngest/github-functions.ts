import { inngest } from './client';
import { prisma } from '@/lib/prisma';
import { decryptToken, createMultipleFiles, createOrUpdateFile } from '@/lib/github';

/**
 * GitHub sync function that handles automatic code synchronization
 */
export const githubSyncFunction = inngest.createFunction(
  { id: 'github-sync' },
  { event: 'github/sync' },
  async ({ event, step }) => {
    const { fragmentId, projectId, commitMessage } = event.data;

    await step.run('validate-inputs', async () => {
      if (!fragmentId || !projectId) {
        throw new Error('Fragment ID and Project ID are required');
      }
    });

    // Get fragment and project with GitHub repository
    const { fragment, project, repository, connection } = await step.run('get-data', async () => {
      const fragment = await prisma.fragment.findUnique({
        where: { id: fragmentId },
        include: {
          message: {
            include: {
              project: {
                include: {
                  githubRepository: {
                    include: {
                      githubConnection: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!fragment) {
        throw new Error('Fragment not found');
      }

      const project = fragment.message.project;
      const repository = project.githubRepository;
      const connection = repository?.githubConnection;

      if (!repository || !connection) {
        throw new Error('Project does not have a GitHub repository or connection');
      }

      return { fragment, project, repository, connection };
    });

    // Update sync status to IN_PROGRESS
    await step.run('update-sync-status-progress', async () => {
      await prisma.gitHubRepository.update({
        where: { id: repository.id },
        data: {
          syncStatus: 'IN_PROGRESS',
          syncError: null,
        },
      });
    });

    try {
      // Sync files to GitHub
      await step.run('sync-files', async () => {
        const accessToken = decryptToken(connection.accessToken);
        const files = fragment.files as Record<string, string>;

        if (!files || Object.keys(files).length === 0) {
          throw new Error('No files to sync');
        }

        const [owner, repo] = repository.fullName.split('/');

        // Use multiple files commit for efficiency
        await createMultipleFiles(
          accessToken,
          owner,
          repo,
          files,
          commitMessage || `Update project files - ${new Date().toISOString()}`,
          repository.defaultBranch
        );
      });

      // Update sync status to SUCCESS
      await step.run('update-sync-status-success', async () => {
        await prisma.gitHubRepository.update({
          where: { id: repository.id },
          data: {
            syncStatus: 'SUCCESS',
            lastSyncAt: new Date(),
            syncError: null,
          },
        });
      });

      return {
        success: true,
        message: 'Files synced successfully to GitHub',
        repository: repository.fullName,
      };

    } catch (error) {
      // Update sync status to FAILED
      await step.run('update-sync-status-failed', async () => {
        await prisma.gitHubRepository.update({
          where: { id: repository.id },
          data: {
            syncStatus: 'FAILED',
            syncError: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      });

      throw error;
    }
  }
);

/**
 * GitHub repository creation sync function
 * Syncs initial files when a repository is created
 */
export const githubInitialSyncFunction = inngest.createFunction(
  { id: 'github-initial-sync' },
  { event: 'github/initial-sync' },
  async ({ event, step }) => {
    const { repositoryId } = event.data;

    await step.run('validate-inputs', async () => {
      if (!repositoryId) {
        throw new Error('Repository ID is required');
      }
    });

    // Get repository and related data
    const { repository, connection, project } = await step.run('get-repository-data', async () => {
      const repository = await prisma.gitHubRepository.findUnique({
        where: { id: repositoryId },
        include: {
          githubConnection: true,
          project: {
            include: {
              messages: {
                include: {
                  fragment: true,
                },
                orderBy: {
                  createdAt: 'desc',
                },
              },
            },
          },
        },
      });

      if (!repository) {
        throw new Error('Repository not found');
      }

      return {
        repository,
        connection: repository.githubConnection,
        project: repository.project,
      };
    });

    // Update sync status to IN_PROGRESS
    await step.run('update-sync-status-progress', async () => {
      await prisma.gitHubRepository.update({
        where: { id: repository.id },
        data: {
          syncStatus: 'IN_PROGRESS',
          syncError: null,
        },
      });
    });

    try {
      // Find the latest fragment with files
      const latestFragment = project.messages
        .map(m => m.fragment)
        .filter(f => f !== null)
        .find(f => f && typeof f.files === 'object' && Object.keys(f.files as Record<string, string>).length > 0);

      if (!latestFragment) {
        // No files to sync, mark as success
        await step.run('no-files-to-sync', async () => {
          await prisma.gitHubRepository.update({
            where: { id: repository.id },
            data: {
              syncStatus: 'SUCCESS',
              lastSyncAt: new Date(),
            },
          });
        });

        return {
          success: true,
          message: 'No files to sync - repository initialized successfully',
        };
      }

      // Sync files to GitHub
      await step.run('sync-initial-files', async () => {
        const accessToken = decryptToken(connection.accessToken);
        const files = latestFragment.files as Record<string, string>;
        const [owner, repo] = repository.fullName.split('/');

        // Create README if it doesn't exist
        const filesWithReadme = {
          ...files,
          'README.md': files['README.md'] || `# ${repository.name}\n\nProject generated with [CrazyNator](${process.env.NEXT_PUBLIC_APP_URL})\n\n## Description\n\n${repository.description || 'No description provided.'}\n\n## Getting Started\n\nThis project was automatically generated and synced from CrazyNator.\n`,
        };

        await createMultipleFiles(
          accessToken,
          owner,
          repo,
          filesWithReadme,
          'Initial project setup from CrazyNator',
          repository.defaultBranch
        );
      });

      // Update sync status to SUCCESS
      await step.run('update-sync-status-success', async () => {
        await prisma.gitHubRepository.update({
          where: { id: repository.id },
          data: {
            syncStatus: 'SUCCESS',
            lastSyncAt: new Date(),
            syncError: null,
          },
        });
      });

      return {
        success: true,
        message: 'Initial files synced successfully to GitHub',
        repository: repository.fullName,
      };

    } catch (error) {
      // Update sync status to FAILED
      await step.run('update-sync-status-failed', async () => {
        await prisma.gitHubRepository.update({
          where: { id: repository.id },
          data: {
            syncStatus: 'FAILED',
            syncError: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      });

      throw error;
    }
  }
);

/**
 * Batch GitHub sync function for multiple projects
 * Useful for bulk operations or retrying failed syncs
 */
export const githubBatchSyncFunction = inngest.createFunction(
  { id: 'github-batch-sync' },
  { event: 'github/batch-sync' },
  async ({ event, step }) => {
    const { projectIds, userId } = event.data;

    await step.run('validate-inputs', async () => {
      if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
        throw new Error('Project IDs array is required');
      }
      if (!userId) {
        throw new Error('User ID is required');
      }
    });

    // Get all repositories for the projects
    const repositories = await step.run('get-repositories', async () => {
      const repositories = await prisma.gitHubRepository.findMany({
        where: {
          projectId: { in: projectIds },
          githubConnection: {
            userId: userId,
          },
        },
        include: {
          project: {
            include: {
              messages: {
                include: {
                  fragment: true,
                },
                orderBy: {
                  createdAt: 'desc',
                },
                take: 1, // Get only the latest message with fragment
              },
            },
          },
        },
      });

      return repositories;
    });

    // Trigger individual sync jobs for each repository
    const syncResults = await step.run('trigger-individual-syncs', async () => {
      const results = [];

      for (const repository of repositories) {
        const latestFragment = repository.project.messages
          .map(m => m.fragment)
          .filter(f => f !== null)[0];

        if (latestFragment) {
          try {
            // Send sync event for each repository
            await inngest.send({
              name: 'github/sync',
              data: {
                fragmentId: latestFragment.id,
                projectId: repository.projectId,
                commitMessage: `Batch sync - ${new Date().toISOString()}`,
              },
            });

            results.push({
              repositoryId: repository.id,
              repositoryName: repository.fullName,
              status: 'queued',
            });
          } catch (error) {
            results.push({
              repositoryId: repository.id,
              repositoryName: repository.fullName,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        } else {
          results.push({
            repositoryId: repository.id,
            repositoryName: repository.fullName,
            status: 'skipped',
            reason: 'No files to sync',
          });
        }
      }

      return results;
    });

    return {
      success: true,
      message: `Batch sync initiated for ${repositories.length} repositories`,
      results: syncResults,
    };
  }
);