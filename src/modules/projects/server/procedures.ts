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
          } catch (sandboxError) {
            // If it fails to connect to the sandbox, just log the error
            // The sandbox may have expired or be unavailable
            console.warn('Failed to update sandbox files:', sandboxError);
          }
        }

        // Trigger GitHub sync if repository exists
        try {
          const githubRepo = await prisma.gitHubRepository.findUnique({
            where: { projectId: fragment.message.project.id },
          });
          
          if (githubRepo) {
            await inngest.send({
              name: 'github/sync',
              data: {
                fragmentId: input.fragmentId,
                projectId: fragment.message.project.id,
                commitMessage: `Update project files: Manual edit`,
              },
            });
          }
        } catch (syncError) {
          console.error('Failed to trigger GitHub sync:', syncError);
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
      const fragmentAge = Date.now() - fragment.createdAt.getTime();
      const isOldFragment = fragmentAge > 15 * 60 * 1000; // 15 minutes (E2B timeout)
      
      if (isOldFragment) {
        console.log(`[DOWNLOAD] Fragment is ${Math.round(fragmentAge / 60000)} minutes old, sandbox likely expired`);
      }

      try {
        // Extract sandboxId from E2B URL
        const url = new URL(fragment.sandboxUrl);
        const hostname = url.hostname;
        const sandboxId = hostname.replace(/^\d+-/, '').replace(/\.e2b\.app$/, '');

        if (!sandboxId || sandboxId === 'www' || sandboxId === 'https') {
          throw new Error('Invalid sandbox ID extracted from URL');
        }

        console.log(`[DOWNLOAD] Attempting to connect to sandbox: ${sandboxId}`);

        // Try to connect to sandbox
        let sandbox;
        try {
          sandbox = await getSandbox(sandboxId);
        } catch (sandboxError) {
          console.error(`[DOWNLOAD] Sandbox connection failed:`, sandboxError);
          
          // If sandbox doesn't exist or is expired, fallback to database files
          if (sandboxError instanceof Error && 
              (sandboxError.message.includes('404') || 
               sandboxError.message.includes("doesn't exist") ||
               sandboxError.message.includes('not found'))) {
            
            console.log(`[DOWNLOAD] Sandbox expired/unavailable, falling back to database files`);
            
            // Use the source code download logic as fallback
            const files = fragment.files as Record<string, string>;
            
            if (!files || Object.keys(files).length === 0) {
              throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Sandbox is no longer available and no files found in database. Please regenerate your project.',
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
              'Thumbs.db'
            ];

            console.log(`[DOWNLOAD] Processing ${Object.keys(files).length} files from database (fallback)`);

            // Create ZIP from database files
            const zip = new JSZip();
            let includedFiles = 0;
            let excludedFiles = 0;
            
            for (const [filePath, content] of Object.entries(files)) {
              // Check if file should be excluded
              const shouldExclude = sourceExcludePatterns.some(pattern => 
                filePath.includes(pattern) || filePath.startsWith(pattern + '/')
              );
              
              if (shouldExclude) {
                console.log(`[DOWNLOAD] Excluding: ${filePath}`);
                excludedFiles++;
                continue;
              }
              
              // CRITICAL: Never include node_modules
              if (filePath.includes('node_modules')) {
                console.error(`[DOWNLOAD] CRITICAL: Attempted to include node_modules file: ${filePath}`);
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
              compressionOptions: { level: 6 }
            });

            // Create filename with project name and timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            const filename = `${project.name}-fallback-${timestamp}.zip`;

            console.log(`[DOWNLOAD] Fallback ZIP created: ${includedFiles} files, ${Math.round(zipBuffer.length / 1024)}KB`);
            
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
        ];

        // Build find command to list all files excluding unwanted patterns
        const excludeArgs = excludePatterns
          .map(pattern => {
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
        
        const findCommand = `find /home/user -type f ${excludeArgs} -print`;
        
        console.log(`[DOWNLOAD] Executing find command with exclusions: ${excludePatterns.join(', ')}`);
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

        if (listBuffer.stderr && listBuffer.stderr.trim()) {
          console.warn('Find command warnings:', listBuffer.stderr);
        }

        const allFiles = listBuffer.stdout
          .split('\n')
          .filter(file => file.trim() && !file.includes('/.'))
          .map(file => file.trim().replace('/home/user/', ''))
          .filter(file => {
            if (file.length === 0) return false;
            
            // CRITICAL: Double-check we NEVER include node_modules or other excluded patterns
            const shouldExclude = excludePatterns.some(pattern => {
              const cleanPattern = pattern.replace('/', '');
              return file.includes(cleanPattern) || file.startsWith(cleanPattern + '/');
            });
            
            if (shouldExclude) {
              console.log(`[DOWNLOAD] Excluding file: ${file}`);
              return false;
            }
            
            return true;
          });

        if (allFiles.length === 0) {
          throw new Error('No files found in sandbox');
        }
        
        console.log(`[DOWNLOAD] Found ${allFiles.length} files to include in ZIP`);
        console.log(`[DOWNLOAD] Sample files:`, allFiles.slice(0, 10));

        // Create ZIP file
        const zip = new JSZip();
        let processedFiles = 0;
        let skippedFiles = 0;

        // Read and add each file to ZIP
        for (const filePath of allFiles) {
          try {
            // Final safety check - NEVER add node_modules
            if (filePath.includes('node_modules')) {
              console.error(`[DOWNLOAD] CRITICAL: Attempted to include node_modules file: ${filePath}`);
              skippedFiles++;
              continue;
            }
            
            const content = await sandbox.files.read(filePath);
            zip.file(filePath, content);
            processedFiles++;
          } catch (readError) {
            console.warn(`[DOWNLOAD] Failed to read file ${filePath}:`, readError);
            skippedFiles++;
            // Skip files that can't be read (permissions, binary files, etc.)
            continue;
          }
        }

        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({ 
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });

        // Create filename with project name and timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const filename = `${project.name}-full-${timestamp}.zip`;

        console.log(`[DOWNLOAD] ZIP created successfully: ${processedFiles} files, ${Math.round(zipBuffer.length / 1024)}KB`);
        
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
          '.git',
          '.next',
          'dist',
          'build',
          '.cache',
          '.tmp',
          '.env',
          '.DS_Store',
          'Thumbs.db'
        ];

        console.log(`[DOWNLOAD-SOURCE] Processing ${Object.keys(files).length} files from database`);

        // Add all files to the ZIP (with exclusion check)
        let includedFiles = 0;
        let excludedFiles = 0;
        
        for (const [filePath, content] of Object.entries(files)) {
          // Check if file should be excluded
          const shouldExclude = sourceExcludePatterns.some(pattern => 
            filePath.includes(pattern) || filePath.startsWith(pattern + '/')
          );
          
          if (shouldExclude) {
            console.log(`[DOWNLOAD-SOURCE] Excluding: ${filePath}`);
            excludedFiles++;
            continue;
          }
          
          // CRITICAL: Never include node_modules
          if (filePath.includes('node_modules')) {
            console.error(`[DOWNLOAD-SOURCE] CRITICAL: Attempted to include node_modules file: ${filePath}`);
            excludedFiles++;
            continue;
          }
          
          zip.file(filePath, content);
          includedFiles++;
        }
        
        console.log(`[DOWNLOAD-SOURCE] Included ${includedFiles} files, excluded ${excludedFiles} files`);

        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({ 
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });

        // Create filename with project name and timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const filename = `${project.name}-${timestamp}.zip`;

        console.log(`[DOWNLOAD-SOURCE] ZIP created: ${includedFiles} files, ${Math.round(zipBuffer.length / 1024)}KB`);
        
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
