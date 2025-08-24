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
  console.log(`[SandboxRecreation] Starting recreation for fragment ${fragment.id}`);
  console.log(`[SandboxRecreation] Current sandbox URL: ${fragment.sandboxUrl}`);
  console.log(`[SandboxRecreation] Fragment files count: ${Object.keys(fragment.files as Record<string, string> || {}).length}`);

  try {
    console.log(`[SandboxRecreation] Creating new E2B sandbox...`);
    
    // Create a new sandbox
    const newSandbox = await createSandbox();
    console.log(`[SandboxRecreation] New sandbox created with ID: ${newSandbox.sandboxId}`);
    
    // Get the new sandbox URL
    const host = newSandbox.getHost(3000);
    const newSandboxUrl = `https://${host}`;
    console.log(`[SandboxRecreation] New sandbox URL: ${newSandboxUrl}`);

    // Restore all files from the fragment
    const files = fragment.files as Record<string, string>;
    console.log(`[SandboxRecreation] Files to restore:`, Object.keys(files || {}));
    
    if (files && Object.keys(files).length > 0) {
      console.log(`[SandboxRecreation] Writing ${Object.keys(files).length} files to new sandbox...`);
      
      // Write all files to the new sandbox
      for (const [filePath, content] of Object.entries(files)) {
        console.log(`[SandboxRecreation] Writing file: ${filePath} (${content.length} characters)`);
        try {
          await newSandbox.files.write(filePath, content);
          console.log(`[SandboxRecreation] Successfully wrote file: ${filePath}`);
        } catch (fileError) {
          console.error(`[SandboxRecreation] Failed to write file ${filePath}:`, fileError);
          throw new Error(`Failed to write file ${filePath}: ${fileError}`);
        }
      }
      console.log(`[SandboxRecreation] All files written successfully`);
    } else {
      console.log(`[SandboxRecreation] No files to restore`);
    }

    console.log(`[SandboxRecreation] Updating fragment in database...`);

    // Update the fragment with the new sandbox URL
    await prisma.fragment.update({
      where: { id: fragment.id },
      data: {
        sandboxUrl: newSandboxUrl,
        updatedAt: new Date(),
      },
    });

    console.log(`[SandboxRecreation] Fragment updated successfully in database`);

    const result = {
      success: true,
      newSandboxUrl,
      fragmentId: fragment.id,
    };
    
    console.log(`[SandboxRecreation] Recreation completed successfully:`, result);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[SandboxRecreation] Failed to recreate sandbox for fragment ${fragment.id}:`, errorMessage);
    console.error(`[SandboxRecreation] Full error:`, error);

    const result = {
      success: false,
      error: errorMessage,
      fragmentId: fragment.id,
    };
    
    console.log(`[SandboxRecreation] Recreation failed:`, result);
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
  console.log(`[SandboxRetries] Starting sandbox recreation with retries for fragment ${fragment.id}`);
  console.log(`[SandboxRetries] Max retries: ${maxRetries}, delay: ${retryDelay}ms`);
  
  let lastError: string = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[SandboxRetries] Attempt ${attempt}/${maxRetries} for fragment ${fragment.id}`);
    
    try {
      const result = await recreateSandbox(fragment);
      console.log(`[SandboxRetries] Attempt ${attempt} result:`, result);
      
      if (result.success) {
        console.log(`[SandboxRetries] Success on attempt ${attempt} for fragment ${fragment.id}`);
        return result;
      }

      lastError = result.error || 'Unknown error';
      console.log(`[SandboxRetries] Attempt ${attempt} failed: ${lastError}`);
      
      // If it's the last attempt, don't wait
      if (attempt < maxRetries) {
        const waitTime = retryDelay * attempt;
        console.log(`[SandboxRetries] Waiting ${waitTime}ms before attempt ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(`[SandboxRetries] Attempt ${attempt} threw exception:`, error);
      
      if (attempt < maxRetries) {
        const waitTime = retryDelay * attempt;
        console.log(`[SandboxRetries] Waiting ${waitTime}ms before attempt ${attempt + 1} after exception`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  const finalError = `Failed after ${maxRetries} attempts. Last error: ${lastError}`;
  console.error(`[SandboxRetries] All attempts failed for fragment ${fragment.id}: ${finalError}`);

  return {
    success: false,
    error: finalError,
    fragmentId: fragment.id,
  };
}