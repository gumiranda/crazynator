import { Fragment, useCallback, useMemo, useState } from 'react';
import type { FileCollection } from '@/types/files';
import { CopyIcon, SaveIcon, EditIcon, EyeIcon } from 'lucide-react';
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
import CodeEditor from '@/components/code-editor';
import CodeView from '@/components/code-view';
import Hint from '@/components/hint';
import FileTreeView from './file-tree-view';
import { convertFilesToTreeItems } from '@/lib/convert';
import { useTRPC } from '@/trpc/client';
import { useMutation } from '@tanstack/react-query';

const getLanguageFromExtension = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension || 'text';
};

type FileExploreProps = {
  files?: FileCollection;
  fragmentId?: string;
  readOnly?: boolean;
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

export default function FileExplore({ files = {}, fragmentId, readOnly = false }: FileExploreProps) {
  const [activeFile, setActiveFile] = useState<string | null>(() => {
    const fileKeys = Object.keys(files);
    return fileKeys.length > 0 ? fileKeys[0] : null;
  });

  const [copied, setCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!readOnly);
  const [editedFiles, setEditedFiles] = useState<FileCollection>(files);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const trpc = useTRPC();

  // Mutation for updating fragment files
  const updateFragment = useMutation(
    trpc.projects.updateFragment.mutationOptions({
      onSuccess: () => {
        toast.success('Files saved and synced with sandbox');
        setHasUnsavedChanges(false);
        // Update the local files state
        setEditedFiles({ ...editedFiles });
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to save files');
      },
    })
  );

  const handleCopyToClipboard = () => {
    if (!activeFile || !editedFiles[activeFile]) {
      toast.error('No file selected');
      return;
    }

    navigator.clipboard.writeText(editedFiles[activeFile]);
    setCopied(true);
    toast.success('Copied to clipboard');

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleFileChange = useCallback(
    (filePath: string, newContent: string) => {
      if (readOnly) return;

      setEditedFiles(prev => ({
        ...prev,
        [filePath]: newContent,
      }));
      setHasUnsavedChanges(true);
    },
    [readOnly]
  );

  const handleSaveFiles = useCallback(() => {
    if (!fragmentId || !hasUnsavedChanges) return;

    updateFragment.mutate({
      fragmentId,
      files: editedFiles,
    });
  }, [fragmentId, hasUnsavedChanges, editedFiles, updateFragment]);

  const toggleEditMode = useCallback(() => {
    if (readOnly) return;
    setIsEditMode(prev => !prev);
  }, [readOnly]);

  const treeItems = useMemo(() => {
    return convertFilesToTreeItems(editedFiles);
  }, [editedFiles]);

  const handleFileSelect = useCallback(
    (filePath: string) => {
      if (editedFiles[filePath]) {
        setActiveFile(filePath);
      }
    },
    [editedFiles],
  );

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={30} minSize={20} className="bg-sidebar">
        <FileTreeView data={treeItems} value={activeFile} onSelect={handleFileSelect} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={70} minSize={50}>
        {activeFile && editedFiles[activeFile] ? (
          <div className="flex h-full w-full flex-col">
            <div className="bg-sidebar flex items-center justify-between gap-x-2 border-b px-4 py-2">
              <FileBreadcrumb filePath={activeFile} />
              <div className="flex items-center gap-2">
                {fragmentId && !readOnly && (
                  <>
                    <Hint text={isEditMode ? "Switch to read-only" : "Switch to edit mode"} side="bottom">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleEditMode}
                      >
                        {isEditMode ? <EyeIcon className="h-4 w-4" /> : <EditIcon className="h-4 w-4" />}
                      </Button>
                    </Hint>
                    
                    {hasUnsavedChanges && (
                      <Hint text="Save changes" side="bottom">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleSaveFiles}
                          disabled={updateFragment.isPending}
                        >
                          <SaveIcon className="h-4 w-4" />
                          {updateFragment.isPending ? 'Syncing...' : 'Save'}
                        </Button>
                      </Hint>
                    )}
                  </>
                )}
                
                {hasUnsavedChanges && (
                  <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    Unsaved changes
                  </div>
                )}
                
                <Hint text="Copy to clipboard" side="bottom">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    disabled={copied || !activeFile}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </Hint>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {isEditMode && !readOnly ? (
                <CodeEditor
                  value={editedFiles[activeFile]}
                  language={getLanguageFromExtension(activeFile)}
                  onChange={(newContent) => handleFileChange(activeFile, newContent)}
                  readOnly={false}
                />
              ) : (
                <CodeView 
                  code={editedFiles[activeFile]} 
                  language={getLanguageFromExtension(activeFile)} 
                />
              )}
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            Select a file to view its contents
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
