import { Fragment, useCallback, useMemo, useState } from 'react';
import type { FileCollection } from '@/types/files';
import { CopyIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import CodeView from '@/components/code-view';
import Hint from '@/components/hint';
import FileTreeView from './file-tree-view';
import { convertFilesToTreeItems } from '@/lib/convert';

const getLanguageFromExtension = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension || 'text';
};

type FileExploreProps = {
  files?: FileCollection;
};

type FileBreadcrumbProps = {
  filePath: string;
};

const FileBreadcrumb = ({ filePath }: FileBreadcrumbProps) => {
  const pathSegments = filePath.split('/');
  const maxSegments = 3;

  const renderBreadcrumbItems = () => {
    if (pathSegments.length <= maxSegments) {
      return pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;
        return (
          <Fragment key={index}>
            <BreadcrumbItem>
              {isLast ? (
                <BreadcrumbPage className="font-medium">{segment}</BreadcrumbPage>
              ) : (
                <span className="text-muted-foreground">{segment}</span>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </Fragment>
        );
      });
    } else {
      const firstSegments = pathSegments[0];
      const lastSegments = pathSegments[pathSegments.length - 1];
      return (
        <Fragment>
          <BreadcrumbItem>
            <span className="text-muted-foreground">{firstSegments}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">{lastSegments}</BreadcrumbPage>
          </BreadcrumbItem>
        </Fragment>
      );
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>{renderBreadcrumbItems()}</BreadcrumbList>
    </Breadcrumb>
  );
};

export default function FileExplore({ files = {} }: FileExploreProps) {
  const [activeFile, setActiveFile] = useState<string | null>(() => {
    const fileKeys = Object.keys(files);
    return fileKeys.length > 0 ? fileKeys[0] : null;
  });

  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = () => {
    if (!activeFile || !files[activeFile]) {
      toast.error('No file selected');
      return;
    }

    navigator.clipboard.writeText(files[activeFile]);
    setCopied(true);
    toast.success('Copied to clipboard');

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const treeItems = useMemo(() => {
    return convertFilesToTreeItems(files);
  }, [files]);

  const handleFileSelect = useCallback(
    (filePath: string) => {
      if (files[filePath]) {
        setActiveFile(filePath);
      }
    },
    [files],
  );

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={30} minSize={20} className="bg-sidebar">
        <FileTreeView data={treeItems} value={activeFile} onSelect={handleFileSelect} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={70} minSize={50}>
        {activeFile && files[activeFile] ? (
          <div className="flex h-full w-full flex-col">
            <div className="bg-sidebar flex items-center justify-between gap-x-2 border-b px-4 py-2">
              <FileBreadcrumb filePath={activeFile} />
              <Hint text="Copy to clipboard" side="bottom">
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={handleCopyToClipboard}
                  disabled={copied || !activeFile}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </Hint>
            </div>
            <div className="flex-1 overflow-auto">
              <CodeView code={files[activeFile]} language={getLanguageFromExtension(activeFile)} />
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            Select a file to view it&apos;s contents
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
