import { prisma } from '@/lib/prisma';
import { createSandbox } from '@/lib/sandbox';
import { Fragment } from '@prisma/client';

export interface RecreationResult {
  success: boolean;
  newSandboxUrl?: string;
  error?: string;
  fragmentId: string;
}

/**
 * Recreate an expired sandbox and restore all files
 */
export async function recreateSandbox(fragment: Fragment): Promise<RecreationResult> {
  try {
    // Create a new sandbox
    const newSandbox = await createSandbox();
    
    // Get the new sandbox URL
    const host = newSandbox.getHost(3000);
    const newSandboxUrl = `https://${host}`;

    // Restore all files from the fragment
    const files = fragment.files as Record<string, string>;
    
    if (files && Object.keys(files).length > 0) {
      // Write all files to the new sandbox
      for (const [filePath, content] of Object.entries(files)) {
        try {
          await newSandbox.files.write(filePath, content);
        } catch (fileError) {
          throw new Error(`Failed to write file ${filePath}: ${fileError}`);
        }
      }
    }

    // Update the fragment with the new sandbox URL
    await prisma.fragment.update({
      where: { id: fragment.id },
      data: {
        sandboxUrl: newSandboxUrl,
        updatedAt: new Date(),
      },
    });

    const result = {
      success: true,
      newSandboxUrl,
      fragmentId: fragment.id,
    };
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    const result = {
      success: false,
      error: errorMessage,
      fragmentId: fragment.id,
    };
    
    return result;
  }
}

/**
 * Recreate multiple expired sandboxes with controlled concurrency
 */
export async function recreateMultipleSandboxes(
  fragments: Fragment[]
): Promise<{
  successful: RecreationResult[];
  failed: RecreationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}> {
  const successful: RecreationResult[] = [];
  const failed: RecreationResult[] = [];

  // Process in chunks to avoid overwhelming E2B API
  const chunkSize = 3; // Recreate 3 sandboxes at a time
  
  for (let i = 0; i < fragments.length; i += chunkSize) {
    const chunk = fragments.slice(i, i + chunkSize);
    
    const results = await Promise.all(
      chunk.map(fragment => recreateSandbox(fragment))
    );

    results.forEach(result => {
      if (result.success) {
        successful.push(result);
      } else {
        failed.push(result);
      }
    });

    // Delay between chunks
    if (i + chunkSize < fragments.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return {
    successful,
    failed,
    summary: {
      total: fragments.length,
      successful: successful.length,
      failed: failed.length,
    },
  };
}

/**
 * Recreate sandbox with retry logic
 */
export async function recreateSandboxWithRetries(
  fragment: Fragment,
  maxRetries: number = 3,
  retryDelay: number = 2000
): Promise<RecreationResult> {
  let lastError: string = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await recreateSandbox(fragment);
      
      if (result.success) {
        return result;
      }

      lastError = result.error || 'Unknown error';
      
      // If it's the last attempt, don't wait
      if (attempt < maxRetries) {
        const waitTime = retryDelay * attempt;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      
      if (attempt < maxRetries) {
        const waitTime = retryDelay * attempt;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  const finalError = `Failed after ${maxRetries} attempts. Last error: ${lastError}`;

  return {
    success: false,
    error: finalError,
    fragmentId: fragment.id,
  };
}