import { protectedProcedure, createTRPCRouter } from '@/trpc/init';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { inngest } from '@/inngest/client';
import { generateSlug } from 'random-word-slugs';
import { TRPCError } from '@trpc/server';
import { consumeCredits, validateCreditsBeforeAction } from '@/lib/usage';
import { projectChannel } from '@/inngest/channels';
import { getSubscriptionToken } from '@inngest/realtime';
import { getSandbox } from '@/lib/sandbox';
import JSZip from 'jszip';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// Helper function to chunk array into smaller batches
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Helper function to compress file data for Inngest payload
async function compressFiles(files: Record<string, string>): Promise<string> {
  const jsonString = JSON.stringify(files);
  const compressed = await gzipAsync(Buffer.from(jsonString, 'utf8'));
  return compressed.toString('base64');
}

// Helper function to decompress file data from Inngest payload
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function decompressFiles(compressedData: string): Promise<Record<string, string>> {
  const compressed = Buffer.from(compressedData, 'base64');
  const decompressed = await gunzipAsync(compressed);
  return JSON.parse(decompressed.toString('utf8'));
}

export const projectsRouter = createTRPCRouter({
  updateFragment: protectedProcedure
    .input(
      z.object({
        fragmentId: z.string().min(1, 'Fragment ID is required'),
        files: z.record(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check if the fragment belongs to the user
      const fragment = await prisma.fragment.findFirst({
        where: {
          id: input.fragmentId,
          message: {
            project: {
              userId: ctx.auth.userId,
            },
          },
        },
        include: {
          message: {
            include: {
              project: true,
            },
          },
        },
      });

      if (!fragment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fragment not found',
        });
      }

      try {
        // Update files in the database
        const updatedFragment = await prisma.fragment.update({
          where: { id: input.fragmentId },
          data: {
            files: input.files,
          },
        });

        // Try to update files in E2B sandbox (if still active)
        if (fragment.sandboxUrl) {
          try {
            // Extract sandboxId from E2B URL
            // Real format: https://3000-sandboxId.e2b.app
            const url = new URL(fragment.sandboxUrl);
            const hostname = url.hostname;

            // Extract sandboxId from hostname (part after the first hyphen)
            const sandboxId = hostname.replace(/^\d+-/, '').replace(/\.e2b\.app$/, '');

            if (sandboxId && sandboxId !== 'www' && sandboxId !== 'https') {
              const sandbox = await getSandbox(sandboxId);

              // Update each file in the sandbox
              for (const [filePath, content] of Object.entries(input.files)) {
                await sandbox.files.write(filePath, content);
              }
            }
          } catch {
            // If it fails to connect to the sandbox, continue
            // The sandbox may have expired or be unavailable
          }
        }

        // Trigger GitHub sync if repository exists
        try {
          const githubRepo = await prisma.gitHubRepository.findUnique({
            where: { projectId: fragment.message.project.id },
          });

          if (githubRepo) {
            // Use batched sync for manual updates as well
            const BATCH_SIZE = 15;
            const fileEntries = Object.entries(input.files);
            const fileBatches = chunkArray(fileEntries, BATCH_SIZE);

            // Send multiple batched sync events with compressed data
            const batchEvents = await Promise.all(
              fileBatches.map(async (batch, index) => {
                const batchFiles = Object.fromEntries(batch);
                const compressedFiles = await compressFiles(batchFiles);

                return {
                  name: 'github/batch-sync',
                  data: {
                    repositoryId: githubRepo.id,
                    batchIndex: index,
                    totalBatches: fileBatches.length,
                    compressedFiles,
                    isLastBatch: index === fileBatches.length - 1,
                    commitMessage: `Update project files: Manual edit`,
                    uncompressedSize: JSON.stringify(batchFiles).length,
                    compressedSize: compressedFiles.length,
                  },
                };
              }),
            );

            await inngest.send(batchEvents);
          }
        } catch {
          // Don't fail the main operation if GitHub sync fails
        }

        return updatedFragment;
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update fragment',
        });
      }
    }),

  generateSubscriptionToken: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'Project ID is required'),
      }),
    )
    .mutation(async ({ input }) => {
      const subscriptionToken = await getSubscriptionToken(inngest, {
        channel: projectChannel(input.projectId),
        topics: ['realtime'],
      });

      return subscriptionToken;
    }),
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: 'Project is required' }),
      }),
    )
    .query(async ({ input, ctx }) => {
      const project = await prisma.project.findUnique({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
      });
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }
      return project;
    }),
  getMany: protectedProcedure.query(async ({ ctx }) => {
    const projects = await prisma.project.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      orderBy: {
        updatedAt: 'asc',
      },
    });
    return projects;
  }),
  create: protectedProcedure
    .input(
      z.object({
        value: z.string().min(1, { message: 'Prompt is required' }).max(10000, {
          message: 'Prompt is too long',
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Validate credits before attempting to consume
      try {
        const status = await validateCreditsBeforeAction();

        // Show warning if credits are low (but still allow action)
        if (status.isLowCredits) {
          console.warn(
            `User ${ctx.auth.userId} has low credits: ${status.remainingPoints}/${status.plan.credits} (${Math.round(status.creditsPercentage * 100)}%)`,
          );
        }
      } catch (error) {
        if (error instanceof Error) {
          // Provide plan-specific error messages
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: error.message,
          });
        } else {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unable to validate credits',
          });
        }
      }

      // Actually consume the credits
      try {
        await consumeCredits();
      } catch {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Failed to consume credits',
        });
      }
      const createdProject = await prisma.project.create({
        data: {
          name: generateSlug(2, { format: 'kebab' }),
          userId: ctx.auth.userId,
          messages: {
            create: {
              content: input.value,
              role: 'USER',
              type: 'RESULT',
            },
          },
        },
      });
      await inngest.send({
        name: 'code-agent/run',
        data: {
          projectId: createdProject.id,
          value: input.value,
        },
      });
      return createdProject;
    }),

  downloadFullProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'Project ID is required'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Find the project and verify user ownership
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
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
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Find the latest fragment with sandbox
      const latestFragmentMessage = project.messages.find(
        (message) => message.fragment && message.fragment.sandboxUrl,
      );

      if (!latestFragmentMessage?.fragment?.sandboxUrl) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active sandbox found for this project',
        });
      }

      const fragment = latestFragmentMessage.fragment;

      // Check if fragment is old (sandbox likely expired)
      // Fragment expires after 15 minutes (E2B timeout)

      try {
        // Extract sandboxId from E2B URL
        const url = new URL(fragment.sandboxUrl);
        const hostname = url.hostname;
        const sandboxId = hostname.replace(/^\d+-/, '').replace(/\.e2b\.app$/, '');

        if (!sandboxId || sandboxId === 'www' || sandboxId === 'https') {
          throw new Error('Invalid sandbox ID extracted from URL');
        }

        // Try to connect to sandbox
        let sandbox;
        try {
          sandbox = await getSandbox(sandboxId);
        } catch (sandboxError) {
          // If sandbox doesn't exist or is expired, fallback to database files
          if (
            sandboxError instanceof Error &&
            (sandboxError.message.includes('404') ||
              sandboxError.message.includes("doesn't exist") ||
              sandboxError.message.includes('not found'))
          ) {
            // Use the source code download logic as fallback
            const files = fragment.files as Record<string, string>;

            if (!files || Object.keys(files).length === 0) {
              throw new TRPCError({
                code: 'NOT_FOUND',
                message:
                  'Sandbox is no longer available and no files found in database. Please regenerate your project.',
              });
            }

            // Apply the same filtering logic to database files
            const sourceExcludePatterns = [
              'node_modules',
              '.git',
              '.next',
              'dist',
              'build',
              '.cache',
              '.tmp',
              '.turbo',
              '.vercel',
              'out',
              '.env',
              '.DS_Store',
              'Thumbs.db',
            ];

            // Create ZIP from database files
            const zip = new JSZip();
            let includedFiles = 0;
            let excludedFiles = 0;

            for (const [filePath, content] of Object.entries(files)) {
              // Check if file should be excluded
              const shouldExclude = sourceExcludePatterns.some(
                (pattern) => filePath.includes(pattern) || filePath.startsWith(pattern + '/'),
              );

              if (shouldExclude) {
                console.log(`[DOWNLOAD] Excluding: ${filePath}`);
                excludedFiles++;
                continue;
              }

              // CRITICAL: Never include node_modules
              if (filePath.includes('node_modules')) {
                console.error(
                  `[DOWNLOAD] CRITICAL: Attempted to include node_modules file: ${filePath}`,
                );
                excludedFiles++;
                continue;
              }

              zip.file(filePath, content);
              includedFiles++;
            }

            // Generate ZIP buffer
            const zipBuffer = await zip.generateAsync({
              type: 'nodebuffer',
              compression: 'DEFLATE',
              compressionOptions: { level: 6 },
            });

            // Create filename with project name and timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            const filename = `${project.name}-fallback-${timestamp}.zip`;

            console.log(
              `[DOWNLOAD] Fallback ZIP created: ${includedFiles} files, ${Math.round(zipBuffer.length / 1024)}KB`,
            );

            return {
              filename,
              data: zipBuffer.toString('base64'),
              size: zipBuffer.length,
              fileCount: includedFiles,
              totalFoundFiles: Object.keys(files).length,
              skippedFiles: excludedFiles,
              isFallback: true, // Indicate this came from database fallback
            };
          } else {
            // Re-throw other sandbox errors
            throw sandboxError;
          }
        }

        // Define patterns to exclude (NEVER include node_modules or other unnecessary files)
        const excludePatterns = [
          'nextjs-app',
          'node_modules/',
          '.git/',
          '.next/',
          'dist/',
          'build/',
          '.cache/',
          '.tmp/',
          '.turbo/',
          '.vercel/',
          'out/',
          '.DS_Store',
          'Thumbs.db',
          '*.log',
          '.env',
          '.env.local',
          '.env.development',
          '.env.production',
          '.env.*.local',
          'coverage/',
          '.nyc_output/',
          '*.tsbuildinfo',
          '.swc/',
          'app/favicon.ico',
          // E2B sandbox specific files - NEVER include these
          '.bash_logout',
          '.bashrc',
          '.e2b',
          '.profile',
          'compile_page.sh',
          '.npm',
          '.nvmrc',
        ];

        // Build find command to list ONLY FILES excluding unwanted patterns
        const excludeArgs = excludePatterns
          .map((pattern) => {
            if (pattern.endsWith('/')) {
              // For directories, exclude the entire directory tree
              return `-path "*/${pattern}*" -prune -o`;
            } else if (pattern.includes('*')) {
              // For wildcard patterns
              return `-name "${pattern}" -prune -o`;
            } else {
              // For specific files/directories
              return `-name "${pattern}" -prune -o`;
            }
          })
          .join(' ');

        // CRITICAL: Use -type f to ensure we ONLY get files, not directories
        // This will recursively find ALL files in the directory structure
        const findCommand = `find /home/user -type f ${excludeArgs} -print`;

        console.log(
          `[DOWNLOAD] Executing find command with exclusions: ${excludePatterns.join(', ')}`,
        );
        console.log(`[DOWNLOAD] Full command: ${findCommand}`);

        // Get list of all files
        const listBuffer = { stdout: '', stderr: '' };
        await sandbox.commands.run(findCommand, {
          onStdout: (data: string) => {
            listBuffer.stdout += data;
          },
          onStderr: (data: string) => {
            listBuffer.stderr += data;
          },
        });

        console.log(
          `[DOWNLOAD] Find command completed. Stdout length: ${listBuffer.stdout.length}, Stderr: ${listBuffer.stderr}`,
        );

        if (listBuffer.stderr && listBuffer.stderr.trim()) {
          console.warn('Find command warnings:', listBuffer.stderr);
        }

        // Parse the raw output first
        const rawFiles = listBuffer.stdout
          .split('\n')
          .filter((file) => file.trim())
          .map((file) => file.trim().replace('/home/user/', ''));

        console.log(`[DOWNLOAD] Raw files from find command (first 10):`, rawFiles.slice(0, 10));

        // Check if layout.tsx was found by find command
        const rawLayoutFiles = rawFiles.filter((f) => f.includes('layout.tsx'));
        console.log(`[DOWNLOAD] Raw layout.tsx files from find:`, rawLayoutFiles);

        const allFiles = rawFiles
          .filter((file) => !file.includes('/.')) // Remove hidden files
          .filter((file) => {
            if (file.length === 0) return false;

            // Since we're using `find -type f`, we should only get files
            // But let's keep a basic check for obviously problematic paths
            if (!file || file === '.' || file === '..' || file.endsWith('/')) {
              console.log(`[DOWNLOAD] Skipping invalid path: ${file}`);
              return false;
            }

            // CRITICAL: Double-check we NEVER include node_modules or other excluded patterns
            const matchingPatterns = excludePatterns.filter((pattern) => {
              const cleanPattern = pattern.replace('/', '');

              // More precise matching - avoid false positives like "app" matching "out"
              if (pattern.endsWith('/')) {
                // For directory patterns like 'out/', 'node_modules/', match only directory paths
                const segments = file.split('/');
                return segments.includes(cleanPattern);
              } else if (pattern.startsWith('*.')) {
                // For file extension patterns like '*.log'
                return file.endsWith(pattern.substring(1));
              } else if (pattern.includes('/')) {
                // For specific file paths like 'app/favicon.ico'
                return file === pattern || file.endsWith('/' + pattern);
              } else {
                // For specific file names
                return file.includes(cleanPattern);
              }
            });

            if (matchingPatterns.length > 0) {
              // Special alert if we're excluding a layout file
              if (file.includes('layout.tsx')) {
                console.warn(
                  `[DOWNLOAD] ⚠️ EXCLUDING LAYOUT FILE: ${file} - matches patterns: ${matchingPatterns.join(', ')}`,
                );
              } else if (!file?.includes('node_modules')) {
                console.log(
                  `[DOWNLOAD] Excluding file: ${file} - matches patterns: ${matchingPatterns.join(', ')}`,
                );
              }
              return false;
            }

            return true;
          });

        if (allFiles.length === 0) {
          throw new Error('No files found in sandbox');
        }

        console.log(`[DOWNLOAD] Found ${allFiles.length} files to include in ZIP`);
        console.log(`[DOWNLOAD] Sample files:`, allFiles.slice(0, 10));

        // Check specifically for layout.tsx files
        const layoutFiles = allFiles.filter((f) => f.includes('layout.tsx'));
        console.log(`[DOWNLOAD] Layout.tsx files found:`, layoutFiles);

        // Check for all .tsx files to see what we're getting
        const tsxFiles = allFiles.filter((f) => f.endsWith('.tsx'));
        console.log(`[DOWNLOAD] All .tsx files found (${tsxFiles.length}):`, tsxFiles.slice(0, 20));

        // Debug: Test our filtering logic with the problematic files
        console.log('\n[DOWNLOAD] === FILTER DEBUG ===');
        const testFiles = [
          'app/layout.tsx',
          'app/favicon.ico',
          'nextjs-app/app/layout.tsx',
          'out/test.js',
          'node_modules/test.js',
        ];
        testFiles.forEach((testFile) => {
          const matchingPatterns = excludePatterns.filter((pattern) => {
            const cleanPattern = pattern.replace('/', '');

            if (pattern.endsWith('/')) {
              const segments = testFile.split('/');
              return segments.includes(cleanPattern);
            } else if (pattern.startsWith('*.')) {
              return testFile.endsWith(pattern.substring(1));
            } else if (pattern.includes('/')) {
              // For specific file paths like 'app/favicon.ico'
              return testFile === pattern || testFile.endsWith('/' + pattern);
            } else {
              return testFile.includes(cleanPattern);
            }
          });
          console.log(
            `[DOWNLOAD] ${testFile} -> matches: [${matchingPatterns.join(', ')}] -> ${matchingPatterns.length > 0 ? 'EXCLUDED' : 'INCLUDED'}`,
          );
        });
        console.log('[DOWNLOAD] === END FILTER DEBUG ===\n');

        // Create ZIP file
        const zip = new JSZip();
        let processedFiles = 0;
        let skippedFiles = 0;

        // Read and add each file to ZIP
        for (const filePath of allFiles) {
          try {
            // Final safety check - NEVER add node_modules
            if (filePath.includes('node_modules')) {
              console.error(
                `[DOWNLOAD] CRITICAL: Attempted to include node_modules file: ${filePath}`,
              );
              skippedFiles++;
              continue;
            }

            // Special logging for layout.tsx files
            if (filePath.includes('layout.tsx')) {
              console.log(`[DOWNLOAD] Processing layout file: ${filePath}`);
            }

            // Try to read the file
            try {
              const content = await sandbox.files.read(filePath);

              // Successfully read file, add to ZIP maintaining directory structure
              zip.file(filePath, content);
              processedFiles++;

              // Special confirmation for layout.tsx files
              if (filePath.includes('layout.tsx')) {
                console.log(
                  `[DOWNLOAD] ✅ Successfully added layout file: ${filePath} (${content.length} bytes)`,
                );
              }
            } catch (readError) {
              // Check if it's specifically a directory error
              if (readError instanceof Error) {
                const errorMsg = readError.message.toLowerCase();

                if (
                  errorMsg.includes('is a directory') ||
                  errorMsg.includes('eisdir') ||
                  (errorMsg.includes('invalidargument') && errorMsg.includes('directory'))
                ) {
                  console.log(`[DOWNLOAD] Path is directory (skipping): ${filePath}`);
                  skippedFiles++;
                  continue;
                }

                // For permission errors, binary files, etc.
                if (
                  errorMsg.includes('permission') ||
                  errorMsg.includes('binary') ||
                  errorMsg.includes('not found')
                ) {
                  console.warn(`[DOWNLOAD] Cannot read ${filePath}: ${readError.message}`);
                  skippedFiles++;
                  continue;
                }
              }

              // For unexpected errors, log details but continue
              console.warn(`[DOWNLOAD] Unexpected error reading ${filePath}:`, readError);
              skippedFiles++;
              continue;
            }
          } catch (outerError) {
            console.warn(`[DOWNLOAD] Outer error processing ${filePath}:`, outerError);
            skippedFiles++;
            continue;
          }
        }

        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        });

        // Create filename with project name and timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const filename = `${project.name}-full-${timestamp}.zip`;

        console.log(
          `[DOWNLOAD] ZIP created successfully: ${processedFiles} files, ${Math.round(zipBuffer.length / 1024)}KB`,
        );

        return {
          filename,
          data: zipBuffer.toString('base64'),
          size: zipBuffer.length,
          fileCount: processedFiles,
          totalFoundFiles: allFiles.length,
          skippedFiles: skippedFiles,
        };
      } catch (error) {
        console.error('Failed to download full project:', error);

        if (error instanceof Error) {
          if (error.message.includes('sandbox') || error.message.includes('connect')) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Sandbox is no longer available. Please generate the project again.',
            });
          }
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to download full project from sandbox',
        });
      }
    }),

  syncFullProjectToGitHub: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'Project ID is required'),
        commitMessage: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Find the project and verify user ownership
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
        include: {
          messages: {
            include: {
              fragment: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          githubRepository: {
            include: {
              githubConnection: true,
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

      if (!project.githubRepository) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project does not have a GitHub repository configured',
        });
      }

      // Find the latest fragment with sandbox
      const latestFragmentMessage = project.messages.find(
        (message) => message.fragment && message.fragment.sandboxUrl,
      );

      if (!latestFragmentMessage?.fragment?.sandboxUrl) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active sandbox found for this project',
        });
      }

      const fragment = latestFragmentMessage.fragment;

      // Check if fragment is old (sandbox likely expired)
      // Fragment expires after 15 minutes (E2B timeout)

      try {
        // Extract sandboxId from E2B URL
        const url = new URL(fragment.sandboxUrl);
        const hostname = url.hostname;
        const sandboxId = hostname.replace(/^\d+-/, '').replace(/\.e2b\.app$/, '');

        if (!sandboxId || sandboxId === 'www' || sandboxId === 'https') {
          throw new Error('Invalid sandbox ID extracted from URL');
        }

        // Try to connect to sandbox
        let sandbox;
        const allFiles: Record<string, string> = {};

        // Initialize counters for file processing

        try {
          sandbox = await getSandbox(sandboxId);

          // Use the same exclusion patterns as downloadFullProject
          const excludePatterns = [
            'nextjs-app',
            'node_modules/',
            '.git/',
            '.next/',
            'dist/',
            'build/',
            '.cache/',
            '.tmp/',
            '.turbo/',
            '.vercel/',
            'out/',
            '.DS_Store',
            'Thumbs.db',
            '*.log',
            '.env',
            '.env.local',
            '.env.development',
            '.env.production',
            '.env.*.local',
            'coverage/',
            '.nyc_output/',
            '*.tsbuildinfo',
            '.swc/',
            'app/favicon.ico',
            // E2B sandbox specific files - NEVER include these in GitHub
            '.bash_logout',
            '.bashrc',
            '.e2b',
            '.profile',
            'compile_page.sh',
            '.npm',
            '.nvmrc',
          ];

          // Build find command to list ONLY FILES excluding unwanted patterns
          const excludeArgs = excludePatterns
            .map((pattern) => {
              if (pattern.endsWith('/')) {
                return `-path "*/${pattern}*" -prune -o`;
              } else if (pattern.includes('*')) {
                return `-name "${pattern}" -prune -o`;
              } else {
                return `-name "${pattern}" -prune -o`;
              }
            })
            .join(' ');

          const findCommand = `find /home/user -type f ${excludeArgs} -print`;

          // Get list of all files
          const listBuffer = { stdout: '', stderr: '' };
          await sandbox.commands.run(findCommand, {
            onStdout: (data: string) => {
              listBuffer.stdout += data;
            },
            onStderr: (data: string) => {
              listBuffer.stderr += data;
            },
          });

          // Parse the raw output
          const rawFiles = listBuffer.stdout
            .split('\n')
            .filter((file) => file.trim())
            .map((file) => file.trim().replace('/home/user/', ''));

          const validFiles = rawFiles
            .filter((file) => !file.includes('/.')) // Remove hidden files
            .filter((file) => {
              if (file.length === 0) return false;

              // Since we're using `find -type f`, we should only get files
              // But let's keep a basic check for obviously problematic paths
              if (!file || file === '.' || file === '..' || file.endsWith('/')) {
                console.log(`[GITHUB_SYNC] Skipping invalid path: ${file}`);
                return false;
              }

              // CRITICAL: Double-check we NEVER include node_modules or other excluded patterns
              const matchingPatterns = excludePatterns.filter((pattern) => {
                const cleanPattern = pattern.replace('/', '');

                // More precise matching - avoid false positives like "app" matching "out"
                if (pattern.endsWith('/')) {
                  // For directory patterns like 'out/', 'node_modules/', match only directory paths
                  const segments = file.split('/');
                  return segments.includes(cleanPattern);
                } else if (pattern.startsWith('*.')) {
                  // For file extension patterns like '*.log'
                  return file.endsWith(pattern.substring(1));
                } else if (pattern.includes('/')) {
                  // For specific file paths like 'app/favicon.ico'
                  return file === pattern || file.endsWith('/' + pattern);
                } else {
                  // For specific file names
                  return file.includes(cleanPattern);
                }
              });

              if (matchingPatterns.length > 0) {
                console.log(
                  `[GITHUB_SYNC] Excluding file: ${file} - matches patterns: ${matchingPatterns.join(', ')}`,
                );
                return false;
              }

              return true;
            });

          // Read all files and build the files object
          for (const filePath of validFiles) {
            try {
              // CRITICAL: Never include node_modules
              if (filePath.includes('node_modules')) {
                continue;
              }

              // Try to read the file
              try {
                const content = await sandbox.files.read(filePath);
                allFiles[filePath] = content;
              } catch (readError) {
                // Check if it's specifically a directory error
                if (readError instanceof Error) {
                  const errorMsg = readError.message.toLowerCase();

                  if (
                    errorMsg.includes('is a directory') ||
                    errorMsg.includes('eisdir') ||
                    (errorMsg.includes('invalidargument') && errorMsg.includes('directory'))
                  ) {
                    continue;
                  }

                  // For permission errors, binary files, etc.
                  if (
                    errorMsg.includes('permission') ||
                    errorMsg.includes('binary') ||
                    errorMsg.includes('not found')
                  ) {
                    continue;
                  }
                }

                // For unexpected errors, continue
                continue;
              }
            } catch {
              continue;
            }
          }
        } catch (sandboxError) {
          // Fallback to database files if sandbox is expired
          if (
            sandboxError instanceof Error &&
            (sandboxError.message.includes('404') ||
              sandboxError.message.includes("doesn't exist") ||
              sandboxError.message.includes('not found'))
          ) {
            const files = fragment.files as Record<string, string>;
            if (!files || Object.keys(files).length === 0) {
              throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Sandbox is no longer available and no files found in database.',
              });
            }

            // Apply exclusion patterns to database files
            const sourceExcludePatterns = [
              'node_modules',
              '.git',
              '.next',
              'dist',
              'build',
              '.cache',
              '.tmp',
              '.turbo',
              '.vercel',
              'out',
              '.env',
              '.DS_Store',
              'Thumbs.db',
              '.bash_logout',
              '.bashrc',
              '.e2b',
              '.profile',
              'compile_page.sh',
              '.npm',
              '.nvmrc',
            ];

            for (const [filePath, content] of Object.entries(files)) {
              const shouldExclude = sourceExcludePatterns.some(
                (pattern) => filePath.includes(pattern) || filePath.startsWith(pattern + '/'),
              );

              if (!shouldExclude && !filePath.includes('node_modules')) {
                allFiles[filePath] = content;
              }
            }
          } else {
            throw sandboxError;
          }
        }

        if (Object.keys(allFiles).length === 0) {
          throw new Error('No files found to sync');
        }

        // Update the fragment with all the collected files
        await prisma.fragment.update({
          where: { id: fragment.id },
          data: {
            files: allFiles,
          },
        });

        // Trigger GitHub sync using batched approach with compression
        const BATCH_SIZE = 15; // Process 15 files per batch to stay under payload limits
        const fileEntries = Object.entries(allFiles);
        const fileBatches = chunkArray(fileEntries, BATCH_SIZE);

        // Send multiple batched sync events with compressed data
        const batchEvents = await Promise.all(
          fileBatches.map(async (batch, index) => {
            const batchFiles = Object.fromEntries(batch);
            const compressedFiles = await compressFiles(batchFiles);

            return {
              name: 'github/batch-sync',
              data: {
                repositoryId: project.githubRepository!.id, // We know it exists from earlier check
                batchIndex: index,
                totalBatches: fileBatches.length,
                compressedFiles,
                isLastBatch: index === fileBatches.length - 1,
                commitMessage:
                  input.commitMessage ||
                  `Sync all files from sandbox - ${new Date().toISOString()}`,
                uncompressedSize: JSON.stringify(batchFiles).length,
                compressedSize: compressedFiles.length,
              },
            };
          }),
        );

        await inngest.send(batchEvents);

        return {
          success: true,
          message: `Started sync of ${Object.keys(allFiles).length} files to GitHub repository`,
          fileCount: Object.keys(allFiles).length,
          repository: project.githubRepository.fullName,
        };
      } catch (error) {
        console.error('Failed to sync full project to GitHub:', error);

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync full project to GitHub',
        });
      }
    }),

  createGitHubRepoWithFullProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'Project ID is required'),
        repositoryName: z.string().min(1, 'Repository name is required'),
        description: z.string().optional(),
        isPrivate: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Find the project and verify user ownership
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
        include: {
          messages: {
            include: {
              fragment: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          githubRepository: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      if (project.githubRepository) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Project already has a GitHub repository',
        });
      }

      // Check if user has GitHub connection
      const githubConnection = await prisma.gitHubConnection.findUnique({
        where: { userId: ctx.auth.userId },
      });

      if (!githubConnection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No GitHub connection found. Please connect your GitHub account first.',
        });
      }

      // Find the latest fragment with sandbox
      const latestFragmentMessage = project.messages.find(
        (message) => message.fragment && message.fragment.sandboxUrl,
      );

      if (!latestFragmentMessage?.fragment?.sandboxUrl) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active sandbox found for this project',
        });
      }

      const fragment = latestFragmentMessage.fragment;

      try {
        // Extract sandboxId from E2B URL and collect all files (same logic as above)
        const url = new URL(fragment.sandboxUrl);
        const hostname = url.hostname;
        const sandboxId = hostname.replace(/^\d+-/, '').replace(/\.e2b\.app$/, '');

        if (!sandboxId || sandboxId === 'www' || sandboxId === 'https') {
          throw new Error('Invalid sandbox ID extracted from URL');
        }

        const allFiles: Record<string, string> = {};

        try {
          const sandbox = await getSandbox(sandboxId);

          // Same exclusion logic as above
          const excludePatterns = [
            'nextjs-app',
            'node_modules/',
            '.git/',
            '.next/',
            'dist/',
            'build/',
            '.cache/',
            '.tmp/',
            '.turbo/',
            '.vercel/',
            'out/',
            '.DS_Store',
            'Thumbs.db',
            '*.log',
            '.env',
            '.env.local',
            '.env.development',
            '.env.production',
            '.env.*.local',
            'coverage/',
            '.nyc_output/',
            '*.tsbuildinfo',
            '.swc/',
            'app/favicon.ico',
            // E2B sandbox specific files - NEVER include these in GitHub
            '.bash_logout',
            '.bashrc',
            '.e2b',
            '.profile',
            'compile_page.sh',
            '.npm',
            '.nvmrc',
          ];

          const excludeArgs = excludePatterns
            .map((pattern) => {
              if (pattern.endsWith('/')) {
                return `-path "*/${pattern}*" -prune -o`;
              } else if (pattern.includes('*')) {
                return `-name "${pattern}" -prune -o`;
              } else {
                return `-name "${pattern}" -prune -o`;
              }
            })
            .join(' ');

          const findCommand = `find /home/user -type f ${excludeArgs} -print`;

          const listBuffer = { stdout: '', stderr: '' };
          await sandbox.commands.run(findCommand, {
            onStdout: (data: string) => {
              listBuffer.stdout += data;
            },
            onStderr: (data: string) => {
              listBuffer.stderr += data;
            },
          });

          const rawFiles = listBuffer.stdout
            .split('\n')
            .filter((file) => file.trim())
            .map((file) => file.trim().replace('/home/user/', ''));

          const validFiles = rawFiles
            .filter((file) => !file.includes('/.')) // Remove hidden files
            .filter((file) => {
              if (file.length === 0) return false;

              // Since we're using `find -type f`, we should only get files
              // But let's keep a basic check for obviously problematic paths
              if (!file || file === '.' || file === '..' || file.endsWith('/')) {
                return false;
              }

              // CRITICAL: Double-check we NEVER include node_modules or other excluded patterns
              const matchingPatterns = excludePatterns.filter((pattern) => {
                const cleanPattern = pattern.replace('/', '');

                // More precise matching - avoid false positives like "app" matching "out"
                if (pattern.endsWith('/')) {
                  // For directory patterns like 'out/', 'node_modules/', match only directory paths
                  const segments = file.split('/');
                  return segments.includes(cleanPattern);
                } else if (pattern.startsWith('*.')) {
                  // For file extension patterns like '*.log'
                  return file.endsWith(pattern.substring(1));
                } else if (pattern.includes('/')) {
                  // For specific file paths like 'app/favicon.ico'
                  return file === pattern || file.endsWith('/' + pattern);
                } else {
                  // For specific file names
                  return file.includes(cleanPattern);
                }
              });

              if (matchingPatterns.length > 0) {
                return false;
              }

              return true;
            });

          // Read all files
          for (const filePath of validFiles) {
            try {
              // CRITICAL: Never include node_modules
              if (filePath.includes('node_modules')) {
                continue;
              }

              // Try to read the file
              try {
                const content = await sandbox.files.read(filePath);
                allFiles[filePath] = content;
              } catch (readError) {
                // Check if it's specifically a directory error
                if (readError instanceof Error) {
                  const errorMsg = readError.message.toLowerCase();

                  if (
                    errorMsg.includes('is a directory') ||
                    errorMsg.includes('eisdir') ||
                    (errorMsg.includes('invalidargument') && errorMsg.includes('directory'))
                  ) {
                    continue;
                  }

                  // For permission errors, binary files, etc.
                  if (
                    errorMsg.includes('permission') ||
                    errorMsg.includes('binary') ||
                    errorMsg.includes('not found')
                  ) {
                    continue;
                  }
                }

                // For unexpected errors, continue
                continue;
              }
            } catch {
              continue;
            }
          }
        } catch {
          // Fallback to database files
          const files = fragment.files as Record<string, string>;

          if (!files || Object.keys(files).length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'No files found to create repository with.',
            });
          }

          const sourceExcludePatterns = [
            'node_modules',
            '.git',
            '.next',
            'dist',
            'build',
            '.cache',
            '.tmp',
            '.turbo',
            '.vercel',
            'out',
            '.env',
            '.DS_Store',
            'Thumbs.db',
            '.bash_logout',
            '.bashrc',
            '.e2b',
            '.profile',
            'compile_page.sh',
            '.npm',
            '.nvmrc',
          ];

          for (const [filePath, content] of Object.entries(files)) {
            const shouldExclude = sourceExcludePatterns.some(
              (pattern) => filePath.includes(pattern) || filePath.startsWith(pattern + '/'),
            );

            if (!shouldExclude && !filePath.includes('node_modules')) {
              allFiles[filePath] = content;
            }
          }
        }

        if (Object.keys(allFiles).length === 0) {
          throw new Error('No files found to create repository with');
        }

        // Update fragment with collected files
        await prisma.fragment.update({
          where: { id: fragment.id },
          data: {
            files: allFiles,
          },
        });

        // Create GitHub repository using the existing GitHub library
        const { decryptToken, createRepository } = await import('@/lib/github');
        const accessToken = decryptToken(githubConnection.accessToken);

        const githubRepo = await createRepository(accessToken, {
          name: input.repositoryName,
          description: input.description || `Generated project: ${project.name}`,
          private: input.isPrivate,
          auto_init: true,
        });

        // Create GitHub repository record in database
        const createdRepository = await prisma.gitHubRepository.create({
          data: {
            githubRepoId: githubRepo.id,
            name: githubRepo.name,
            fullName: githubRepo.full_name,
            description: githubRepo.description,
            isPrivate: githubRepo.private,
            htmlUrl: githubRepo.html_url,
            cloneUrl: githubRepo.clone_url,
            defaultBranch: githubRepo.default_branch,
            projectId: input.projectId,
            githubConnectionId: githubConnection.id,
            syncStatus: 'PENDING',
          },
        });

        // Trigger initial sync to push all files using batched approach with compression
        const BATCH_SIZE = 15; // Process 15 files per batch to stay under payload limits
        const fileEntries = Object.entries(allFiles);
        const fileBatches = chunkArray(fileEntries, BATCH_SIZE);

        // Send multiple batched sync events with compressed data
        const batchEvents = await Promise.all(
          fileBatches.map(async (batch, index) => {
            const batchFiles = Object.fromEntries(batch);
            const compressedFiles = await compressFiles(batchFiles);

            return {
              name: 'github/batch-sync',
              data: {
                repositoryId: createdRepository.id,
                batchIndex: index,
                totalBatches: fileBatches.length,
                compressedFiles,
                isLastBatch: index === fileBatches.length - 1,
                uncompressedSize: JSON.stringify(batchFiles).length,
                compressedSize: compressedFiles.length,
              },
            };
          }),
        );

        await inngest.send(batchEvents);

        return {
          success: true,
          message: `Created GitHub repository and started sync of ${Object.keys(allFiles).length} files`,
          repository: {
            id: createdRepository.id,
            name: githubRepo.name,
            fullName: githubRepo.full_name,
            htmlUrl: githubRepo.html_url,
            fileCount: Object.keys(allFiles).length,
          },
        };
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create GitHub repository with full project',
        });
      }
    }),

  pullFromGitHub: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'Project ID is required'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Find the project and verify user ownership
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
        include: {
          githubRepository: {
            include: {
              githubConnection: true,
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

      if (!project.githubRepository) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project does not have a GitHub repository configured',
        });
      }

      // Check if there's already a pending or processing pull job
      const existingJob = await prisma.gitHubSyncJob.findFirst({
        where: {
          projectId: input.projectId,
          type: 'PULL_FROM_GITHUB',
          status: {
            in: ['PENDING', 'PROCESSING'],
          },
        },
      });

      if (existingJob) {
        return {
          jobId: existingJob.id,
          message: 'GitHub pull job is already in progress',
          status: existingJob.status,
        };
      }

      try {
        // Create a new sync job
        const syncJob = await prisma.gitHubSyncJob.create({
          data: {
            projectId: input.projectId,
            repositoryId: project.githubRepository.id,
            type: 'PULL_FROM_GITHUB',
            status: 'PENDING',
            metadata: {
              repositoryFullName: project.githubRepository.fullName,
              defaultBranch: project.githubRepository.defaultBranch,
            },
          },
        });

        console.log(`[PULL_FROM_GITHUB] Created sync job ${syncJob.id} for project ${input.projectId}`);

        // Trigger the async processing via Inngest
        await inngest.send({
          name: 'github/pull-batch-processor',
          data: {
            jobId: syncJob.id,
            projectId: input.projectId,
            repositoryId: project.githubRepository.id,
          },
        });

        return {
          jobId: syncJob.id,
          message: 'GitHub pull job started successfully',
          status: 'PENDING',
          repository: project.githubRepository.fullName,
        };
      } catch (error) {
        console.error('Failed to create GitHub pull job:', error);
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to start GitHub pull job',
        });
      }
    }),

  // Get sync job status
  getGitHubSyncJobStatus: protectedProcedure
    .input(
      z.object({
        jobId: z.string().min(1, 'Job ID is required'),
      }),
    )
    .query(async ({ input, ctx }) => {
      const job = await prisma.gitHubSyncJob.findFirst({
        where: {
          id: input.jobId,
          project: {
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
          repository: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sync job not found',
        });
      }

      return {
        id: job.id,
        type: job.type,
        status: job.status,
        totalFiles: job.totalFiles,
        processedFiles: job.processedFiles,
        failedFiles: job.failedFiles,
        totalBatches: job.totalBatches,
        processedBatches: job.processedBatches,
        progress: job.totalFiles > 0 ? Math.round((job.processedFiles / job.totalFiles) * 100) : 0,
        error: job.error,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
        project: job.project,
        repository: job.repository,
        metadata: job.metadata,
      };
    }),

  downloadZip: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'Project ID is required'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Find the project and verify user ownership
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
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
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Find the latest fragment with files
      const latestFragmentMessage = project.messages.find(
        (message) => message.fragment && message.fragment.files,
      );

      if (!latestFragmentMessage?.fragment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No project files found to download',
        });
      }

      const fragment = latestFragmentMessage.fragment;
      const files = fragment.files as Record<string, string>;

      try {
        // Create ZIP file
        const zip = new JSZip();

        // Patterns to exclude from source code download
        const sourceExcludePatterns = [
          'node_modules',
          'nexts-app',
          '.git',
          '.next',
          'dist',
          'build',
          '.cache',
          '.tmp',
          '.env',
          '.DS_Store',
          'Thumbs.db',
          '.bash_logout',
          '.bashrc',
          '.e2b',
          '.profile',
          'compile_page.sh',
          '.npm',
          '.nvmrc',
        ];

        console.log(
          `[DOWNLOAD-SOURCE] Processing ${Object.keys(files).length} files from database`,
        );

        // Add all files to the ZIP (with exclusion check)
        let includedFiles = 0;
        let excludedFiles = 0;

        for (const [filePath, content] of Object.entries(files)) {
          // Check if file should be excluded
          const shouldExclude = sourceExcludePatterns.some(
            (pattern) => filePath.includes(pattern) || filePath.startsWith(pattern + '/'),
          );

          if (shouldExclude) {
            console.log(`[DOWNLOAD-SOURCE] Excluding: ${filePath}`);
            excludedFiles++;
            continue;
          }

          // CRITICAL: Never include node_modules
          if (filePath.includes('node_modules')) {
            console.error(
              `[DOWNLOAD-SOURCE] CRITICAL: Attempted to include node_modules file: ${filePath}`,
            );
            excludedFiles++;
            continue;
          }

          zip.file(filePath, content);
          includedFiles++;
        }

        console.log(
          `[DOWNLOAD-SOURCE] Included ${includedFiles} files, excluded ${excludedFiles} files`,
        );

        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        });

        // Create filename with project name and timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const filename = `${project.name}-${timestamp}.zip`;

        console.log(
          `[DOWNLOAD-SOURCE] ZIP created: ${includedFiles} files, ${Math.round(zipBuffer.length / 1024)}KB`,
        );

        // Return the ZIP data as base64 for client download
        return {
          filename,
          data: zipBuffer.toString('base64'),
          size: zipBuffer.length,
          fileCount: includedFiles,
          excludedFiles: excludedFiles,
        };
      } catch (error) {
        console.error('Failed to generate ZIP:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate ZIP file',
        });
      }
    }),
});
