'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLinkIcon, RefreshCcwIcon, AlertTriangleIcon, RotateCcwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Hint from '@/components/hint';
import { Fragment } from '@prisma/client';
import SandboxErrorBoundary from '@/components/SandboxErrorBoundary';
import {
  showRecreationProgress,
  showRecreationSuccess,
  showRecreationError,
} from '@/components/SandboxNotifications';

type SandboxPreviewProps = {
  fragment: Fragment;
  onRefresh?: () => void;
  onSandboxRecreated?: (newUrl: string) => void;
};

interface SandboxError {
  isExpired: boolean;
  message: string;
  canRetry: boolean;
}

export default function SandboxPreview({
  fragment,
  onRefresh,
  onSandboxRecreated,
}: SandboxPreviewProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [sandboxError, setSandboxError] = useState<SandboxError | null>(null);
  const [isRecreating, setIsRecreating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const maxRetries = 1;

  // Auto-refresh when fragment is updated (in case files change)
  useEffect(() => {
    setLastUpdated(new Date());
    setSandboxError(null); // Clear error when fragment updates
    setRetryCount(0); // Reset retry count
  }, [fragment.files, fragment.sandboxUrl]);

  // Listen for iframe load errors to detect sandbox expiration
  const handleIframeError = useCallback(() => {
    console.log(
      `[SandboxPreview] Iframe error detected for fragment ${fragment.id}, URL: ${fragment.sandboxUrl}`,
    );

    setSandboxError({
      isExpired: true,
      message: 'Sandbox may have expired or is not responding',
      canRetry: true,
    });

    console.log(`[SandboxPreview] Iframe error detected - manual recreation required`);
  }, [fragment.id, fragment.sandboxUrl]);

  const recreateSandbox = useCallback(async (): Promise<void> => {
    if (isRecreating) {
      console.log(`[SandboxPreview] Recreation already in progress for fragment ${fragment.id}`);
      return;
    }

    console.log(`[SandboxPreview] Starting sandbox recreation for fragment ${fragment.id}`);
    console.log(`[SandboxPreview] Current sandbox URL: ${fragment.sandboxUrl}`);
    console.log(`[SandboxPreview] Retry count: ${retryCount}/${maxRetries}`);

    setIsRecreating(true);
    setIsLoading(true);
    setSandboxError(null);

    showRecreationProgress(fragment.id);

    try {
      console.log(`[SandboxPreview] Calling recreation API for fragment ${fragment.id}`);

      const response = await fetch('/api/sandbox/recreate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fragmentId: fragment.id,
        }),
      });

      console.log(`[SandboxPreview] Recreation API response status: ${response.status}`);

      const result = await response.json();
      console.log(`[SandboxPreview] Recreation API result:`, result);

      if (!response.ok) {
        console.error(
          `[SandboxPreview] Recreation API failed with status ${response.status}:`,
          result,
        );
        throw new Error(result.error || 'Failed to recreate sandbox');
      }

      if (result.success) {
        console.log(`[SandboxPreview] Recreation successful! New URL: ${result.newSandboxUrl}`);

        // Update the iframe to load the new URL
        setIframeKey((prev) => prev + 1);
        setLastUpdated(new Date());
        setRetryCount(0);

        showRecreationSuccess(fragment.id, result.newSandboxUrl);
        onSandboxRecreated?.(result.newSandboxUrl);
        window.location.reload();
        console.log(
          `[SandboxPreview] Recreation completed successfully for fragment ${fragment.id}`,
        );
      } else {
        console.error(`[SandboxPreview] Recreation failed despite 200 status:`, result);
        throw new Error(result.error || 'Recreation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `[SandboxPreview] Sandbox recreation failed for fragment ${fragment.id}:`,
        errorMessage,
      );
      console.error(`[SandboxPreview] Full error:`, error);

      setSandboxError({
        isExpired: true,
        message: errorMessage,
        canRetry: retryCount < maxRetries,
      });

      showRecreationError(fragment.id, errorMessage);
      setRetryCount((prev) => prev + 1);

      console.log(
        `[SandboxPreview] Updated retry count to ${retryCount + 1} for fragment ${fragment.id}`,
      );
    } finally {
      console.log(`[SandboxPreview] Recreation attempt finished for fragment ${fragment.id}`);
      setIsRecreating(false);
      setIsLoading(false);
    }
  }, [fragment.id, fragment.sandboxUrl, retryCount, maxRetries, isRecreating, onSandboxRecreated]);

  const handleRecreationRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      recreateSandbox();
    }
  }, [retryCount, maxRetries, recreateSandbox]);

  // Detect sandbox expiration by checking iframe load status (passive monitoring only)
  useEffect(() => {
    const checkSandboxHealth = async () => {
      if (!fragment.sandboxUrl || isRecreating) {
        console.log(
          `[SandboxPreview] Skipping health check - sandboxUrl: ${fragment.sandboxUrl}, isRecreating: ${isRecreating}`,
        );
        return;
      }

      console.log(
        `[SandboxPreview] Starting health check for fragment ${fragment.id}, URL: ${fragment.sandboxUrl}`,
      );

      try {
        // Simple health check by attempting to fetch the sandbox URL
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`[SandboxPreview] Health check timeout after 5s for ${fragment.sandboxUrl}`);
          controller.abort();
        }, 5000); // 5 second timeout

        // Try to fetch the sandbox URL to check health
        const response = await fetch(fragment.sandboxUrl, {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`[SandboxPreview] Health check response:`, {
          status: response.status,
          ok: response.ok,
          type: response.type,
          url: response.url,
        });

        // Check for error status codes that indicate sandbox issues
        if (response.status >= 500 || response.status === 404 || response.status === 502) {
          console.log(
            `[SandboxPreview] Sandbox returned error status ${response.status} - manual recreation required`,
          );
          throw new Error(`HTTP ${response.status}: Sandbox not responding properly`);
        } else if (response.ok) {
          console.log(`[SandboxPreview] Health check successful for ${fragment.sandboxUrl}`);

          // If we reach here, sandbox seems accessible
          if (sandboxError) {
            console.log(
              `[SandboxPreview] Clearing previous sandbox error - sandbox seems healthy now`,
            );
            setSandboxError(null);
          }
        } else {
          console.log(`[SandboxPreview] Health check failed - status: ${response.status}`);
          throw new Error(`HTTP ${response.status}: Sandbox not responding properly`);
        }
      } catch (error) {
        console.error(`[SandboxPreview] Health check failed for ${fragment.sandboxUrl}:`, error);

        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`[SandboxPreview] Setting sandbox as expired due to timeout`);
          // Timeout - sandbox might be expired
          setSandboxError({
            isExpired: true,
            message: 'Sandbox is not responding (may be expired) - click to recreate',
            canRetry: true,
          });
        } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          console.log(`[SandboxPreview] Setting sandbox as expired due to network error`);
          setSandboxError({
            isExpired: true,
            message: 'Sandbox connection failed (likely expired) - click to recreate',
            canRetry: true,
          });
        } else {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(
            `[SandboxPreview] Setting sandbox as expired due to generic error: ${errorMessage}`,
          );
          setSandboxError({
            isExpired: true,
            message: 'Sandbox is not accessible (may be expired) - click to recreate',
            canRetry: true,
          });
        }
      }
    };

    console.log(`[SandboxPreview] Setting up health check interval for fragment ${fragment.id}`);

    // Check health every 2 minutes
    const healthInterval = setInterval(
      () => {
        console.log(`[SandboxPreview] Running scheduled health check for fragment ${fragment.id}`);
        checkSandboxHealth();
      },
      2 * 60 * 1000,
    );

    // Initial check after component mounts (reduced delay)
    setTimeout(() => {
      console.log(`[SandboxPreview] Running initial health check for fragment ${fragment.id}`);
      checkSandboxHealth();
    }, 2000);

    return () => {
      console.log(`[SandboxPreview] Cleaning up health check interval for fragment ${fragment.id}`);
      clearInterval(healthInterval);
    };
  }, [fragment.sandboxUrl, isRecreating, fragment.id, sandboxError]);

  // Listen for retry events from notifications
  useEffect(() => {
    const handleRetryEvent = (event: CustomEvent) => {
      if (event.detail.fragmentId === fragment.id) {
        handleRecreationRetry();
      }
    };

    const handleForceRecreation = (event: CustomEvent) => {
      if (event.detail.fragmentId === fragment.id) {
        console.log(`[SandboxPreview] Force recreation event received for fragment ${fragment.id}`);
        recreateSandbox();
      }
    };

    window.addEventListener('sandbox-retry', handleRetryEvent as EventListener);
    window.addEventListener('force-sandbox-recreation', handleForceRecreation as EventListener);

    return () => {
      window.removeEventListener('sandbox-retry', handleRetryEvent as EventListener);
      window.removeEventListener(
        'force-sandbox-recreation',
        handleForceRecreation as EventListener,
      );
    };
  }, [fragment.id, handleRecreationRetry, recreateSandbox]);

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
    setLastUpdated(new Date());
    setSandboxError(null);
    onRefresh?.();
    toast.success('Preview refreshed');
  };

  const onCopy = () => {
    if (!fragment.sandboxUrl) {
      toast.error('No sandbox URL found');
      return;
    }
    setCopied(true);

    navigator.clipboard.writeText(fragment.sandboxUrl);
    toast.success('Copied to clipboard');

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleOpenNewTab = () => {
    if (!fragment.sandboxUrl) {
      toast.error('No sandbox URL found');
      return;
    }
    window.open(fragment.sandboxUrl, '_blank');
  };

  return (
    <SandboxErrorBoundary
      fragmentId={fragment.id}
      onRetry={() => {
        setIframeKey((prev) => prev + 1);
        setSandboxError(null);
      }}
    >
      <div className="flex h-full w-full flex-col">
        <div className="bg-sidebar flex items-center gap-2 border-b p-2">
          <Hint text="Refresh preview" side="bottom" align="start">
            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCcwIcon className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </Hint>

          <Hint text="Click to copy sandbox URL" side="bottom" align="start">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 justify-start text-start font-normal"
              disabled={!fragment.sandboxUrl || copied || isLoading}
              onClick={onCopy}
            >
              <span className="truncate">{fragment.sandboxUrl}</span>
            </Button>
          </Hint>

          <Hint text="Open in new tab" side="bottom" align="start">
            <Button
              size="sm"
              variant="outline"
              disabled={!fragment.sandboxUrl || isLoading}
              onClick={handleOpenNewTab}
            >
              <ExternalLinkIcon className="size-4" />
            </Button>
          </Hint>

          <Hint text="Recreate sandbox" side="bottom" align="start">
            <Button
              size="sm"
              variant="outline"
              disabled={isRecreating || isLoading}
              onClick={recreateSandbox}
            >
              <RotateCcwIcon className={`size-4 ${isRecreating ? 'animate-spin' : ''}`} />
            </Button>
          </Hint>

          <div className="text-xs text-muted-foreground hidden sm:block">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        {sandboxError && (
          <Alert className="mx-2 mt-2">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>{sandboxError.message}</span>
                {sandboxError.canRetry && !isRecreating && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={recreateSandbox}
                    disabled={retryCount >= maxRetries}
                  >
                    {retryCount > 0 ? `Retry (${retryCount}/${maxRetries})` : 'Recreate Sandbox'}
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                This sandbox has expired and needs to be recreated with your project files.
                {isRecreating && (
                  <span className="ml-2 text-blue-600">Recreation in progress...</span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="relative flex-1">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <RefreshCcwIcon className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Recreating sandbox...</p>
              </div>
            </div>
          )}

          <iframe
            key={iframeKey}
            className="h-full w-full"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms"
            src={fragment.sandboxUrl}
            onError={handleIframeError}
          />
        </div>
      </div>
    </SandboxErrorBoundary>
  );
}
