'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLinkIcon, RefreshCcwIcon, RotateCcwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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


export default function SandboxPreview({
  fragment,
  onRefresh,
  onSandboxRecreated,
}: SandboxPreviewProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRecreating, setIsRecreating] = useState(false);

  // Auto-refresh when fragment is updated (in case files change)
  useEffect(() => {
    setLastUpdated(new Date());
  }, [fragment.files, fragment.sandboxUrl]);


  const recreateSandbox = useCallback(async (): Promise<void> => {
    if (isRecreating) {
      console.log(`[SandboxPreview] Recreation already in progress for fragment ${fragment.id}`);
      return;
    }

    console.log(`[SandboxPreview] Starting sandbox recreation for fragment ${fragment.id}`);
    setIsRecreating(true);
    showRecreationProgress(fragment.id);

    try {
      const response = await fetch('/api/sandbox/recreate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fragmentId: fragment.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to recreate sandbox');
      }

      if (result.success) {
        setIframeKey((prev) => prev + 1);
        setLastUpdated(new Date());
        showRecreationSuccess(fragment.id, result.newSandboxUrl);
        onSandboxRecreated?.(result.newSandboxUrl);
        window.location.reload();
      } else {
        throw new Error(result.error || 'Recreation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showRecreationError(fragment.id, errorMessage);
      toast.error(`Failed to recreate sandbox: ${errorMessage}`);
    } finally {
      setIsRecreating(false);
    }
  }, [fragment.id, isRecreating, onSandboxRecreated]);


  // Listen for force recreation events from notifications
  useEffect(() => {
    const handleForceRecreation = (event: CustomEvent) => {
      if (event.detail.fragmentId === fragment.id) {
        console.log(`[SandboxPreview] Force recreation event received for fragment ${fragment.id}`);
        recreateSandbox();
      }
    };

    window.addEventListener('force-sandbox-recreation', handleForceRecreation as EventListener);

    return () => {
      window.removeEventListener('force-sandbox-recreation', handleForceRecreation as EventListener);
    };
  }, [fragment.id, recreateSandbox]);

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
    setLastUpdated(new Date());
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
      }}
    >
      <div className="flex h-full w-full flex-col">
        <div className="bg-sidebar flex items-center gap-2 border-b p-2">
          <Hint text="Refresh preview" side="bottom" align="start">
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCcwIcon className="size-4" />
            </Button>
          </Hint>

          <Hint text="Click to copy sandbox URL" side="bottom" align="start">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 justify-start text-start font-normal"
              disabled={!fragment.sandboxUrl || copied}
              onClick={onCopy}
            >
              <span className="truncate">{fragment.sandboxUrl}</span>
            </Button>
          </Hint>

          <Hint text="Open in new tab" side="bottom" align="start">
            <Button
              size="sm"
              variant="outline"
              disabled={!fragment.sandboxUrl}
              onClick={handleOpenNewTab}
            >
              <ExternalLinkIcon className="size-4" />
            </Button>
          </Hint>

          <Hint text="Recreate sandbox" side="bottom" align="start">
            <Button
              size="sm"
              variant="outline"
              disabled={isRecreating}
              onClick={recreateSandbox}
            >
              <RotateCcwIcon className={`size-4 ${isRecreating ? 'animate-spin' : ''}`} />
            </Button>
          </Hint>

          <div className="text-xs text-muted-foreground hidden sm:block">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>


        <div className="relative flex-1">
          {isRecreating && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <RotateCcwIcon className="h-8 w-8 animate-spin mx-auto mb-2" />
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
          />
        </div>
      </div>
    </SandboxErrorBoundary>
  );
}
