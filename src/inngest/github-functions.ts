import { inngest } from './client';
import { prisma } from '@/lib/prisma';
import { decryptToken, createMultipleFiles, createGitHubClient } from '@/lib/github';
import { getSandbox } from '@/lib/sandbox';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

/**
 * Clean invalid Unicode characters that PostgreSQL cannot handle
 */
function cleanFileContent(content: string): string {
  // Remove null bytes and other problematic characters
  return content
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/[\uFFFE\uFFFF]/g, '') // Remove invalid Unicode characters
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ''); // Remove other control characters except \t, \n, \r
}

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
    const { fragment, repository, connection } = await step.run('get-data', async () => {
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

      return { fragment, repository, connection };
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
        const rawFiles = fragment.files as Record<string, string>;

        if (!rawFiles || Object.keys(rawFiles).length === 0) {
          throw new Error('No files to sync');
        }

        // Clean all files to ensure PostgreSQL/GitHub compatibility
        const files: Record<string, string> = {};
        for (const [path, content] of Object.entries(rawFiles)) {
          files[path] = typeof content === 'string' ? cleanFileContent(content) : content;
        }

        const [owner, repo] = repository.fullName.split('/');

        // Use multiple files commit for efficiency
        await createMultipleFiles(
          accessToken,
          owner,
          repo,
          files,
          commitMessage || `Update project files - ${new Date().toISOString()}`,
          repository.defaultBranch,
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
  },
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
        .map((m) => m.fragment)
        .filter((f) => f !== null)
        .find(
          (f) =>
            f &&
            typeof f.files === 'object' &&
            Object.keys(f.files as Record<string, string>).length > 0,
        );

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
          'README.md':
            files['README.md'] ||
            `# ${repository.name}\n\nProject generated with [CrazyNator](${process.env.NEXT_PUBLIC_APP_URL})\n\n## Description\n\n${repository.description || 'No description provided.'}\n\n## Getting Started\n\nThis project was automatically generated and synced from CrazyNator.\n`,
        };

        await createMultipleFiles(
          accessToken,
          owner,
          repo,
          filesWithReadme,
          'Initial project setup from CrazyNator',
          repository.defaultBranch,
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
  },
);

/**
 * New batch file sync function for handling compressed file batches
 * Processes files in batches to avoid payload size limits
 */
export const githubBatchFilesSyncFunction = inngest.createFunction(
  { id: 'github-batch-files-sync' },
  { event: 'github/batch-sync' },
  async ({ event, step }) => {
    const {
      repositoryId,
      batchIndex,
      totalBatches,
      compressedFiles,
      isLastBatch,
      commitMessage,
      uncompressedSize,
      compressedSize,
    } = event.data;

    await step.run('validate-inputs', async () => {
      if (!repositoryId) {
        throw new Error('Repository ID is required');
      }
      if (batchIndex === undefined || totalBatches === undefined) {
        throw new Error('Batch index and total batches are required');
      }
      if (!compressedFiles) {
        throw new Error('Compressed files data is required');
      }
    });

    // Get repository and connection
    const { repository, connection } = await step.run('get-repository-data', async () => {
      const repository = await prisma.gitHubRepository.findUnique({
        where: { id: repositoryId },
        include: {
          githubConnection: true,
        },
      });

      if (!repository) {
        throw new Error('Repository not found');
      }

      return {
        repository,
        connection: repository.githubConnection,
      };
    });

    // Update sync status to IN_PROGRESS on first batch
    if (batchIndex === 0) {
      await step.run('update-sync-status-progress', async () => {
        await prisma.gitHubRepository.update({
          where: { id: repository.id },
          data: {
            syncStatus: 'IN_PROGRESS',
            syncError: null,
          },
        });
      });
    }

    try {
      // Decompress and sync files
      await step.run('sync-batch-files', async () => {
        const accessToken = decryptToken(connection.accessToken);

        // Decompress files
        const { gunzip } = await import('zlib');
        const { promisify } = await import('util');
        const gunzipAsync = promisify(gunzip);

        const compressed = Buffer.from(compressedFiles, 'base64');
        const decompressed = await gunzipAsync(compressed);
        const files = JSON.parse(decompressed.toString('utf8')) as Record<string, string>;

        if (!files || Object.keys(files).length === 0) {
          console.log(`Batch ${batchIndex + 1}/${totalBatches}: No files to sync`);
          return;
        }

        const [owner, repo] = repository.fullName.split('/');
        const batchCommitMessage = `${commitMessage || 'Update project files'} (batch ${batchIndex + 1}/${totalBatches})`;

        console.log(
          `Batch ${batchIndex + 1}/${totalBatches}: Syncing ${Object.keys(files).length} files (${uncompressedSize} → ${compressedSize} bytes)`,
        );

        // Use multiple files commit for efficiency
        await createMultipleFiles(
          accessToken,
          owner,
          repo,
          files,
          batchCommitMessage,
          repository.defaultBranch,
        );
      });

      // Update sync status to SUCCESS on last batch
      if (isLastBatch) {
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
      }

      return {
        success: true,
        message: `Batch ${batchIndex + 1}/${totalBatches} synced successfully`,
        repository: repository.fullName,
        batchIndex,
        totalBatches,
        isLastBatch,
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
  },
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
          .map((m) => m.fragment)
          .filter((f) => f !== null)[0];

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
  },
);

/**
 * GitHub pull batch processor function
 * Handles async processing of GitHub pulls with batching and compression
 */
export const githubPullBatchProcessorFunction = inngest.createFunction(
  {
    id: 'github-pull-batch-processor',
    retries: 3,
  },
  { event: 'github/pull-batch-processor' },
  async ({ event, step }) => {
    const { jobId, projectId, repositoryId } = event.data;

    await step.run('validate-inputs', async () => {
      if (!jobId || !projectId || !repositoryId) {
        throw new Error('Job ID, Project ID, and Repository ID are required');
      }
    });

    // Update job status to PROCESSING
    const job = await step.run('update-job-status-processing', async () => {
      const job = await prisma.gitHubSyncJob.update({
        where: { id: jobId },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
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
              },
            },
          },
          repository: {
            include: {
              githubConnection: true,
            },
          },
        },
      });

      if (!job) {
        throw new Error('Sync job not found');
      }

      // Send real-time update that job started
      await inngest.send({
        name: 'realtime/sync-progress',
        data: {
          jobId,
          projectId,
          type: 'PULL_FROM_GITHUB',
          status: 'PROCESSING',
          progress: {
            processedFiles: 0,
            totalFiles: 0,
            failedFiles: 0,
            processedBatches: 0,
            totalBatches: 0,
            percentage: 0,
          },
          message: `Started pulling files from ${job.repository?.fullName || 'GitHub repository'}`,
        },
      });

      return job;
    });

    try {
      // Get file tree from GitHub with caching and optimization
      const { fileEntries, totalFiles, treeCache } = await step.run(
        'fetch-github-tree',
        async () => {
          const { repository } = job;

          if (!repository) {
            throw new Error('Repository not found');
          }

          const accessToken = decryptToken(repository.githubConnection.accessToken);
          const octokit = createGitHubClient(accessToken);
          const [owner, repo] = repository.fullName.split('/');

          console.log(`[PULL_BATCH] Fetching tree from ${repository.fullName}`);

          // Get the latest commit SHA for caching
          const { data: commit } = await octokit.rest.repos.getCommit({
            owner,
            repo,
            ref: repository.defaultBranch,
          });

          const latestCommitSha = commit.sha;
          const treeSha = commit.commit.tree.sha;

          // Check if we have cached tree data in job metadata
          const cachedMetadata = job.metadata as any;
          const shouldUseCachedTree =
            cachedMetadata?.lastCommitSha === latestCommitSha &&
            cachedMetadata?.treeSha === treeSha &&
            cachedMetadata?.fileEntries;

          let fileEntries: any[];
          let treeCache: any = null;

          if (shouldUseCachedTree) {
            console.log(
              `[PULL_BATCH] Using cached tree data (${cachedMetadata.fileEntries.length} files)`,
            );
            fileEntries = cachedMetadata.fileEntries;
            treeCache = { fromCache: true, commitSha: latestCommitSha, treeSha };
          } else {
            console.log(`[PULL_BATCH] Fetching fresh tree data from GitHub`);

            // Get the repository tree (all files)
            const { data: tree } = await octokit.rest.git.getTree({
              owner,
              repo,
              tree_sha: treeSha,
              recursive: 'true',
            });

            // Filter only files (not directories/submodules) and exclude unnecessary files
            const excludePatterns = [
              'node_modules/',
              '.git/',
              '.next/',
              'dist/',
              'build/',
              '.cache/',
              '.turbo/',
              '.vercel/',
              'out/',
              '.env',
              '.DS_Store',
              'Thumbs.db',
              '*.log',
              '*.tsbuildinfo',
              '.swc/',
            ];

            fileEntries = tree.tree
              .filter((item) => item.type === 'blob' && item.path)
              .filter((item) => {
                // Apply exclusion filters to reduce unnecessary file processing
                return !excludePatterns.some((pattern) => {
                  if (pattern.endsWith('/')) {
                    return item.path?.includes(pattern);
                  } else if (pattern.includes('*')) {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                    return regex.test(item.path || '');
                  } else {
                    return item.path === pattern || item.path?.includes(pattern);
                  }
                });
              });

            console.log(
              `[PULL_BATCH] Found ${fileEntries.length} files (after filtering) in GitHub repository`,
            );

            // Cache the tree data in job metadata for future use
            treeCache = {
              fromCache: false,
              commitSha: latestCommitSha,
              treeSha,
              totalFiles: fileEntries.length,
            };

            await prisma.gitHubSyncJob.update({
              where: { id: jobId },
              data: {
                metadata: {
                  ...cachedMetadata,
                  lastCommitSha: latestCommitSha,
                  treeSha: treeSha,
                  fileEntries: fileEntries,
                  cacheTimestamp: new Date().toISOString(),
                },
              },
            });
          }

          // Update job with total file count
          await prisma.gitHubSyncJob.update({
            where: { id: jobId },
            data: {
              totalFiles: fileEntries.length,
            },
          });

          return { fileEntries, totalFiles: fileEntries.length, treeCache };
        },
      );

      // Process files in batches
      const BATCH_SIZE = 75; // Process 75 files per batch to avoid timeouts
      const batches = [];
      for (let i = 0; i < fileEntries.length; i += BATCH_SIZE) {
        batches.push(fileEntries.slice(i, i + BATCH_SIZE));
      }

      // Update job with batch count
      await step.run('update-job-batch-count', async () => {
        await prisma.gitHubSyncJob.update({
          where: { id: jobId },
          data: {
            totalBatches: batches.length,
          },
        });

        console.log(`[PULL_BATCH] Job ${jobId} updated with ${batches.length} batches`);
      });

      console.log(`[PULL_BATCH] Processing ${totalFiles} files in ${batches.length} batches`);

      // Process each batch
      let allFiles: Record<string, string> = {};
      let processedFiles = 0;
      let failedFiles = 0;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];

        try {
          console.log(`[PULL_BATCH] Starting batch ${batchIndex + 1}/${batches.length}`);

          const batchResult = await step.run(`process-batch-${batchIndex}`, async () => {
            console.log(
              `[PULL_BATCH] Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} files)`,
            );

            if (!job.repository) {
              console.error(`[PULL_BATCH] Repository not found in job for batch ${batchIndex + 1}`);
              throw new Error('Repository not found in job');
            }

            const repository = job.repository;

            if (!repository.githubConnection?.accessToken) {
              console.error(
                `[PULL_BATCH] No GitHub access token found for repository ${repository.fullName}`,
              );
              throw new Error('GitHub access token not found');
            }

            const accessToken = decryptToken(repository.githubConnection.accessToken);
            const octokit = createGitHubClient(accessToken);
            const [owner, repo] = repository.fullName.split('/');

            if (!owner || !repo) {
              console.error(`[PULL_BATCH] Invalid repository fullName: ${repository.fullName}`);
              throw new Error(`Invalid repository fullName: ${repository.fullName}`);
            }

            console.log(
              `[PULL_BATCH] Using GitHub API for ${owner}/${repo} (batch ${batchIndex + 1}/${batches.length})`,
            );

            const batchFiles: Record<string, string> = {};
            let batchProcessed = 0;
            let batchFailed = 0;

            // Process files in this batch
            console.log(
              `[PULL_BATCH] Starting to process ${batch.length} files in batch ${batchIndex + 1}`,
            );

            for (const file of batch) {
              if (!file.path || !file.sha) {
                console.warn(`[PULL_BATCH] Skipping invalid file entry:`, JSON.stringify(file));
                batchFailed++;
                continue;
              }

              try {
                console.log(`[PULL_BATCH] Fetching file: ${file.path} (sha: ${file.sha})`);

                // Get file content from GitHub with retries
                let retries = 3;
                let fileData;

                while (retries > 0) {
                  try {
                    const response = await octokit.rest.git.getBlob({
                      owner,
                      repo,
                      file_sha: file.sha,
                    });
                    fileData = response.data;
                    break;
                  } catch (error) {
                    retries--;
                    console.warn(
                      `[PULL_BATCH] Retry ${4 - retries}/3 failed for ${file.path}:`,
                      error,
                    );

                    if (retries === 0) throw error;

                    // Wait before retry with exponential backoff
                    await new Promise((resolve) => setTimeout(resolve, (4 - retries) * 1000));
                  }
                }

                if (!fileData) {
                  console.warn(`[PULL_BATCH] No file data received for ${file.path}`);
                  batchFailed++;
                  continue;
                }

                // Decode base64 content
                const rawContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
                // Clean invalid Unicode characters that PostgreSQL cannot handle
                const content = cleanFileContent(rawContent);
                batchFiles[file.path] = content;
                batchProcessed++;

                console.log(
                  `[PULL_BATCH] Successfully processed ${file.path} (${content.length} chars)`,
                );
              } catch (fileError) {
                console.error(`[PULL_BATCH] Failed to fetch file ${file.path}:`, fileError);
                batchFailed++;
                continue;
              }
            }

            console.log(
              `[PULL_BATCH] Batch ${batchIndex + 1} completed: ${batchProcessed} processed, ${batchFailed} failed (${Object.keys(batchFiles).length} files in result)`,
            );

            const batchResult = {
              batchFiles,
              batchProcessed,
              batchFailed,
            };

            console.log(`[PULL_BATCH] Returning batch result:`, {
              fileCount: Object.keys(batchFiles).length,
              processed: batchProcessed,
              failed: batchFailed,
            });

            return batchResult;
          });

          // Update counters with batch results - with safety checks
          if (batchResult && typeof batchResult === 'object') {
            if (batchResult.batchFiles && typeof batchResult.batchFiles === 'object') {
              allFiles = { ...allFiles, ...batchResult.batchFiles };
              console.log(
                `[PULL_BATCH] Added ${Object.keys(batchResult.batchFiles).length} files from batch ${batchIndex + 1}`,
              );
            }
            if (typeof batchResult.batchProcessed === 'number') {
              processedFiles += batchResult.batchProcessed;
            }
            if (typeof batchResult.batchFailed === 'number') {
              failedFiles += batchResult.batchFailed;
            }
            console.log(
              `[PULL_BATCH] Batch ${batchIndex + 1} totals: processed=${batchResult.batchProcessed || 0}, failed=${batchResult.batchFailed || 0}`,
            );
          } else {
            console.error(
              `[PULL_BATCH] Batch ${batchIndex + 1} returned invalid result:`,
              batchResult,
            );
            failedFiles += batch.length; // Count all files in this batch as failed
          }

          // Update job progress and send real-time update
          await step.run(`update-progress-${batchIndex}`, async () => {
            await prisma.gitHubSyncJob.update({
              where: { id: jobId },
              data: {
                processedFiles,
                failedFiles,
                processedBatches: batchIndex + 1,
              },
            });

            console.log(`[PULL_BATCH] Updated job progress: ${processedFiles}/${totalFiles} files`);

            // Send real-time progress update
            try {
              await inngest.send({
                name: 'realtime/sync-progress',
                data: {
                  jobId,
                  projectId,
                  type: 'PULL_FROM_GITHUB',
                  status: 'PROCESSING',
                  progress: {
                    processedFiles,
                    totalFiles,
                    failedFiles,
                    processedBatches: batchIndex + 1,
                    totalBatches: batches.length,
                    percentage: Math.round((processedFiles / totalFiles) * 100),
                  },
                  message: `Processing batch ${batchIndex + 1}/${batches.length} - ${processedFiles}/${totalFiles} files`,
                },
              });
            } catch (eventError) {
              console.warn(`[PULL_BATCH] Failed to send progress event:`, eventError);
            }
          });

          console.log(`[PULL_BATCH] Batch ${batchIndex + 1} completed successfully`);
        } catch (batchError) {
          console.error(`[PULL_BATCH] Batch ${batchIndex + 1} failed completely:`, batchError);

          // Update failed files count for the entire batch
          failedFiles += batch.length;

          // Update job with failed batch
          await step.run(`handle-batch-error-${batchIndex}`, async () => {
            await prisma.gitHubSyncJob.update({
              where: { id: jobId },
              data: {
                failedFiles,
                processedBatches: batchIndex + 1,
              },
            });
          });
        }

        // Add a small delay between batches to avoid rate limiting
        if (batchIndex < batches.length - 1) {
          console.log(`[PULL_BATCH] Waiting 2s before next batch...`);
          await step.sleep('batch-delay', '2s');
        }
      }

      console.log(
        `[PULL_BATCH] All batches completed. Final results: ${processedFiles} processed, ${failedFiles} failed`,
      );

      // Update fragment with all GitHub files (with compression if needed)
      await step.run('update-fragment-with-files', async () => {
        // Find the latest fragment with sandbox
        const latestFragmentMessage = job.project.messages.find(
          (message) => message.fragment && message.fragment.sandboxUrl,
        );

        if (!latestFragmentMessage?.fragment) {
          throw new Error('No active fragment found for this project');
        }

        const fragment = latestFragmentMessage.fragment;

        // Merge with existing files - clean all content to ensure PostgreSQL compatibility
        const existingFiles = (fragment.files as Record<string, string>) || {};
        const cleanedExistingFiles: Record<string, string> = {};
        const cleanedNewFiles: Record<string, string> = {};

        // Clean existing files
        for (const [path, content] of Object.entries(existingFiles)) {
          cleanedExistingFiles[path] =
            typeof content === 'string' ? cleanFileContent(content) : content;
        }

        // Clean new files (already cleaned during processing, but ensure consistency)
        for (const [path, content] of Object.entries(allFiles)) {
          cleanedNewFiles[path] = typeof content === 'string' ? cleanFileContent(content) : content;
        }

        const mergedFiles = {
          ...cleanedExistingFiles,
          ...cleanedNewFiles,
        };

        const totalFilesSize = JSON.stringify(mergedFiles).length;
        const fileMB = Math.round((totalFilesSize / (1024 * 1024)) * 100) / 100;

        console.log(
          `[PULL_BATCH] Updating fragment with ${Object.keys(mergedFiles).length} total files (${fileMB}MB uncompressed)`,
        );

        // If files are very large, consider compression (PostgreSQL has limits)
        let filesToStore = mergedFiles;
        let compressionUsed = false;

        if (totalFilesSize > 50 * 1024 * 1024) {
          // If larger than 50MB
          console.log(
            `[PULL_BATCH] Files are large (${fileMB}MB), applying compression optimization`,
          );

          // Compress large text files to save database space
          const compressedFiles: Record<string, any> = {};

          for (const [filePath, content] of Object.entries(mergedFiles)) {
            if (typeof content === 'string' && content.length > 10000) {
              // Compress files larger than 10KB
              try {
                // Ensure content is clean before compression
                const cleanContent = cleanFileContent(content);
                const compressed = await gzipAsync(Buffer.from(cleanContent, 'utf8'));
                compressedFiles[filePath] = {
                  _compressed: true,
                  data: compressed.toString('base64'),
                  originalSize: cleanContent.length,
                };
                compressionUsed = true;
              } catch {
                compressedFiles[filePath] =
                  typeof content === 'string' ? cleanFileContent(content) : content; // Fallback to cleaned original
              }
            } else {
              compressedFiles[filePath] =
                typeof content === 'string' ? cleanFileContent(content) : content;
            }
          }

          filesToStore = compressedFiles;

          if (compressionUsed) {
            const compressedSize = JSON.stringify(filesToStore).length;
            const compressedMB = Math.round((compressedSize / (1024 * 1024)) * 100) / 100;
            const savings = Math.round(((totalFilesSize - compressedSize) / totalFilesSize) * 100);
            console.log(
              `[PULL_BATCH] Compression applied: ${fileMB}MB → ${compressedMB}MB (${savings}% savings)`,
            );
          }
        }

        await prisma.fragment.update({
          where: { id: fragment.id },
          data: {
            files: filesToStore,
          },
        });

        // Try to update sandbox if available
        try {
          const url = new URL(fragment.sandboxUrl);
          const hostname = url.hostname;
          const sandboxId = hostname.replace(/^\d+-/, '').replace(/\.e2b\.app$/, '');

          if (sandboxId && sandboxId !== 'www' && sandboxId !== 'https') {
            console.log(`[PULL_BATCH] Attempting to update sandbox: ${sandboxId}`);

            const sandbox = await getSandbox(sandboxId);

            // Update only new/changed files in sandbox (using cleaned content)
            const currentFiles = (fragment.files as Record<string, string>) || {};
            let sandboxUpdates = 0;

            for (const [filePath, content] of Object.entries(allFiles)) {
              const currentContent = currentFiles[filePath];
              const cleanContent =
                typeof content === 'string' ? cleanFileContent(content) : content;

              // Only update if file is new or changed
              if (!currentContent || currentContent !== cleanContent) {
                try {
                  await sandbox.files.write(filePath, cleanContent);
                  sandboxUpdates++;
                } catch (writeError) {
                  console.warn(`[PULL_BATCH] Failed to write to sandbox ${filePath}:`, writeError);
                }
              }
            }

            console.log(`[PULL_BATCH] Updated ${sandboxUpdates} files in sandbox`);
          }
        } catch (sandboxError) {
          console.warn(`[PULL_BATCH] Sandbox update failed (continuing):`, sandboxError);
        }
      });

      // Update job status to COMPLETED
      await step.run('update-job-status-completed', async () => {
        await prisma.gitHubSyncJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        // Send real-time completion update
        await inngest.send({
          name: 'realtime/sync-progress',
          data: {
            jobId,
            projectId,
            type: 'PULL_FROM_GITHUB',
            status: 'COMPLETED',
            progress: {
              processedFiles,
              totalFiles,
              failedFiles,
              processedBatches: batches.length,
              totalBatches: batches.length,
              percentage: 100,
            },
            message: `Successfully pulled ${processedFiles} files from GitHub${failedFiles > 0 ? ` (${failedFiles} failed)` : ''}`,
            stats: {
              totalFiles,
              processedFiles,
              failedFiles,
              totalBatches: batches.length,
              treeCache,
            },
          },
        });
      });

      console.log(
        `[PULL_BATCH] Job ${jobId} completed: ${processedFiles} processed, ${failedFiles} failed`,
      );

      return {
        success: true,
        message: `Successfully pulled ${processedFiles} files from GitHub`,
        stats: {
          totalFiles,
          processedFiles,
          failedFiles,
          totalBatches: batches.length,
        },
      };
    } catch (error) {
      // Update job status to FAILED
      await step.run('update-job-status-failed', async () => {
        await prisma.gitHubSyncJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          },
        });

        // Send real-time failure update
        await inngest.send({
          name: 'realtime/sync-progress',
          data: {
            jobId,
            projectId,
            type: 'PULL_FROM_GITHUB',
            status: 'FAILED',
            progress: {
              processedFiles: 0,
              totalFiles: 0,
              failedFiles: 0,
              processedBatches: 0,
              totalBatches: 0,
              percentage: 0,
            },
            message: `Failed to pull files from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      });

      console.error(`[PULL_BATCH] Job ${jobId} failed:`, error);
      throw error;
    }
  },
);

/**
 * Real-time sync progress handler function
 * Processes sync progress events and can forward to WebSocket/SSE
 */
export const realtimeSyncProgressFunction = inngest.createFunction(
  {
    id: 'realtime-sync-progress',
    concurrency: {
      limit: 25, // Allow many concurrent progress events
    },
  },
  { event: 'realtime/sync-progress' },
  async ({ event, step }) => {
    const { jobId, projectId, type, status, progress, message } = event.data;

    // Log progress for debugging
    await step.run('log-progress', async () => {
      console.log(`[REALTIME_PROGRESS] Job ${jobId}: ${status} - ${message}`, {
        projectId,
        type,
        progress: progress?.percentage || 0,
        processedFiles: progress?.processedFiles || 0,
        totalFiles: progress?.totalFiles || 0,
      });
    });

    // Here you could add additional processing like:
    // 1. Send to WebSocket connections
    // 2. Send push notifications
    // 3. Update real-time dashboard
    // 4. Store progress metrics

    // For now, we'll just ensure the progress is logged and available
    // The frontend can poll getGitHubSyncJobStatus for real-time updates

    return {
      jobId,
      projectId,
      status,
      progress: progress?.percentage || 0,
      message,
      processed: true,
    };
  },
);
