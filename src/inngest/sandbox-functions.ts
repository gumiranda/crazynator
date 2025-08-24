import { inngest } from './client';
import { scanForExpiredSandboxes } from '@/lib/sandbox-monitor';
import { recreateMultipleSandboxes } from '@/lib/sandbox-recreation';
import type { Fragment } from '@prisma/client';

/**
 * Scheduled function to scan for expired sandboxes and automatically recreate them
 */
export const sandboxMaintenanceFunction = inngest.createFunction(
  {
    id: 'sandbox-maintenance',
    concurrency: 1, // Only run one maintenance job at a time
  },
  // Run every 30 minutes
  { cron: '*/30 * * * *' },
  async ({ step }) => {
    console.log('Starting sandbox maintenance scan...');

    // Step 1: Scan for expired sandboxes
    const scanResults = await step.run('scan-expired-sandboxes', async () => {
      return await scanForExpiredSandboxes();
    });

    const { expired, active, errors } = scanResults;

    console.log(
      `Sandbox scan results: ${expired.length} expired, ${active.length} active, ${errors.length} errors`,
    );

    // Step 2: Recreate expired sandboxes if any found
    if (expired.length > 0) {
      const recreationResults = await step.run('recreate-expired-sandboxes', async () => {
        return await recreateMultipleSandboxes(expired as unknown as Fragment[]);
      });

      const { successful, failed, summary } = recreationResults;

      // Log results
      console.log(
        `Sandbox recreation completed: ${summary.successful}/${summary.total} successful`,
      );

      if (failed.length > 0) {
        console.error(
          'Failed sandbox recreations:',
          failed.map((r) => ({
            fragmentId: r.fragmentId,
            error: r.error,
          })),
        );
      }

      return {
        scanned: {
          total: expired.length + active.length,
          expired: expired.length,
          active: active.length,
          errors: errors.length,
        },
        recreation: summary,
        successful: successful.map((r) => ({ fragmentId: r.fragmentId, newUrl: r.newSandboxUrl })),
        failed: failed.map((r) => ({ fragmentId: r.fragmentId, error: r.error })),
      };
    }

    return {
      scanned: {
        total: expired.length + active.length,
        expired: 0,
        active: active.length,
        errors: errors.length,
      },
      message: 'No expired sandboxes found',
    };
  },
);

/**
 * Manual function to recreate a specific sandbox
 */
export const recreateSandboxFunction = inngest.createFunction(
  { id: 'recreate-sandbox' },
  { event: 'sandbox/recreate' },
  async ({ event, step }) => {
    const { fragmentId, retries = 3 } = event.data;

    console.log(`Recreating sandbox for fragment: ${fragmentId}`);

    const result = await step.run('recreate-sandbox', async () => {
      const { prisma } = await import('@/lib/prisma');
      const { recreateSandboxWithRetries } = await import('@/lib/sandbox-recreation');

      // Get the fragment
      const fragment = await prisma.fragment.findUnique({
        where: { id: fragmentId },
      });

      if (!fragment) {
        throw new Error(`Fragment not found: ${fragmentId}`);
      }

      // Recreate with specified retries
      return await recreateSandboxWithRetries(fragment, retries);
    });

    if (result.success) {
      console.log(
        `Successfully recreated sandbox for fragment ${fragmentId}: ${result.newSandboxUrl}`,
      );
    } else {
      console.error(`Failed to recreate sandbox for fragment ${fragmentId}: ${result.error}`);
    }

    return result;
  },
);

