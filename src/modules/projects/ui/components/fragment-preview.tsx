import { useState } from 'react';
import { ExternalLinkIcon, RefreshCcwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Fragment } from '@/generated/prisma';
import Hint from '@/components/hint';

type FragmentPreviewProps = {
  fragment: Fragment;
};

export default function FragmentPreview({ fragment }: FragmentPreviewProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const onRefresh = () => {
    setIframeKey((prev) => prev + 1);
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
        <Hint text="Refresh" side="bottom" align="start">
          <Button size="sm" variant="outline" onClick={onRefresh}>
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
      </div>
      <iframe
        key={iframeKey}
        className="h-full w-full"
        sandbox="allow-scripts allow-same-origin allow-forms"
        src={fragment.sandboxUrl}
      />
    </div>
  );
}
