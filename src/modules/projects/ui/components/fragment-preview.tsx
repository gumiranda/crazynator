import { useState, useEffect } from 'react';
import { ExternalLinkIcon, RefreshCcwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Fragment } from '@/generated/prisma';
import Hint from '@/components/hint';

type FragmentPreviewProps = {
  fragment: Fragment;
  onRefresh?: () => void;
};

export default function FragmentPreview({ fragment, onRefresh }: FragmentPreviewProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Auto-refresh when fragment is updated (in case files change)
  useEffect(() => {
    setLastUpdated(new Date());
  }, [fragment.files]);

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

        <div className="text-xs text-muted-foreground hidden sm:block">
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
      <iframe
        key={iframeKey}
        className="h-full w-full"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-forms"
        src={fragment.sandboxUrl}
      />
    </div>
  );
}
