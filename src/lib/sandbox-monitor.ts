import { prisma } from '@/lib/prisma';
import { getSandbox } from '@/lib/sandbox';
import { Fragment } from '@prisma/client';

export interface SandboxStatus {
  isExpired: boolean;
  isConnectable: boolean;
  error?: string;
}

/**
 * Check if a sandbox is still active by attempting to connect to it
 */
export async function checkSandboxStatus(sandboxUrl: string): Promise<SandboxStatus> {
  try {
    // Extract sandbox ID from URL format: https://3000-{sandboxId}.e2b.app
    const sandboxIdMatch = sandboxUrl.match(/3000-(.+?)\.e2b\.app/);
    if (!sandboxIdMatch) {
      return {
        isExpired: true,
        isConnectable: false,
        error: 'Invalid sandbox URL format',
      };
    }

    const sandboxId = sandboxIdMatch[1];
    
    // Try to connect to the sandbox
    const sandbox = await getSandbox(sandboxId);
    
    // Test if sandbox is responsive by running a simple command
    await sandbox.commands.run('echo "health-check"', { timeoutMs: 5000 });
    
    return {
      isExpired: false,
      isConnectable: true,
    };
  } catch (error) {
    // Check if error indicates sandbox expiration
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isExpirationError = 
      errorMessage.includes('sandbox not found') ||
      errorMessage.includes('expired') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('not available');

    return {
      isExpired: isExpirationError,
      isConnectable: false,
      error: errorMessage,
    };
  }
}

/**
 * Check the status of all sandboxes for expired ones
 */
export async function scanForExpiredSandboxes(): Promise<{
  expired: Fragment[];
  active: Fragment[];
  errors: Array<{ fragment: Fragment; error: string }>;
}> {
  const fragments = await prisma.fragment.findMany({
    where: {
      sandboxUrl: {
        not: '',
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

  const expired: Fragment[] = [];
  const active: Fragment[] = [];
  const errors: Array<{ fragment: Fragment; error: string }> = [];

  // Check each sandbox in parallel with controlled concurrency
  const chunkSize = 5; // Process 5 sandboxes at a time to avoid overwhelming E2B
  
  for (let i = 0; i < fragments.length; i += chunkSize) {
    const chunk = fragments.slice(i, i + chunkSize);
    
    await Promise.all(
      chunk.map(async (fragment) => {
        try {
          const status = await checkSandboxStatus(fragment.sandboxUrl);
          
          if (status.isExpired) {
            expired.push(fragment);
          } else if (status.isConnectable) {
            active.push(fragment);
          } else {
            errors.push({
              fragment,
              error: status.error || 'Unknown status error',
            });
          }
        } catch (error) {
          errors.push({
            fragment,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })
    );

    // Small delay between chunks to be respectful to E2B API
    if (i + chunkSize < fragments.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { expired, active, errors };
}

/**
 * Mark fragments as expired in the database (add expiration tracking)
 */
export async function markFragmentsAsExpired(fragmentIds: string[]): Promise<void> {
  // For now, we could add an 'isExpired' field to Fragment model in a future migration
  // For this implementation, we'll handle it in the recreation logic
  console.log(`Marking ${fragmentIds.length} fragments as expired:`, fragmentIds);
}