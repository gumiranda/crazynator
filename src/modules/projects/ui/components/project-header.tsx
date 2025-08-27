import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronLeftIcon, SunMoonIcon, DownloadIcon, LoaderIcon, FileArchiveIcon, CodeIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { InngestSubscriptionState } from '@inngest/realtime/hooks';
import {
  InngestConnectionStatus,
  InngestConnectionStatusLabel,
  InngestConnectionStatusIndicator,
} from '@/components/inngest-connection-status';
import { useInngest } from '@/components/ui/inngest-provider';
import { GitHubSyncStatus } from '@/modules/github/ui/components/github-sync-status';
import { CreateRepositoryDialog } from '@/modules/github/ui/components/create-repository-dialog';
import { toast } from 'sonner';
interface Props {
  projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
  const { setTheme, theme } = useTheme();

  const trpc = useTRPC();
  const { data: project } = useSuspenseQuery(trpc.projects.getOne.queryOptions({ id: projectId }));
  const { state: realtimeConnectionState } = useInngest();

  // Download ZIP (source files only) mutation
  const downloadZip = useMutation(
    trpc.projects.downloadZip.mutationOptions({
      onSuccess: (data) => {
        // Create blob from base64 data and trigger download
        triggerDownload(data);
        toast.success(`Source Code Downloaded: ${data.fileCount} files (${Math.round(data.size / 1024)}KB)`);
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to download source code');
      },
    }),
  );

  // Download Full Project mutation
  const downloadFullProject = useMutation(
    trpc.projects.downloadFullProject.mutationOptions({
      onSuccess: (data) => {
        // Create blob from base64 data and trigger download
        triggerDownload(data);
        const sizeKB = Math.round(data.size / 1024);
        const sizeText = sizeKB > 1024 ? `${Math.round(sizeKB / 1024)}MB` : `${sizeKB}KB`;
        
        // Show different message based on whether it was a fallback
        if (data.isFallback) {
          toast.success(`Project Downloaded (Database Files): ${data.fileCount} files (${sizeText})`, {
            description: 'Sandbox expired - downloaded saved files instead. For latest changes, regenerate the project.'
          });
        } else {
          toast.success(`Full Project Downloaded: ${data.fileCount} files (${sizeText})${data.skippedFiles ? ` - ${data.skippedFiles} files skipped` : ''}`);
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to download full project');
      },
    }),
  );

  // Helper function to trigger download
  const triggerDownload = (data: { data: string; filename: string }) => {
    const binaryString = atob(data.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/zip' });

    // Create download link and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = data.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

  const handleDownloadSourceCode = () => {
    downloadZip.mutate({ projectId });
  };

  const handleDownloadFullProject = () => {
    downloadFullProject.mutate({ projectId });
  };
  return (
    <header className="p-2 flex justify-between items-center border-b bg-background z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="focus-visible:ring-0 hover:bg-transparent hover:opacity-75 transition-opacity pl-1 sm:pl-2!"
          >
            <Image
              src="/logo.svg"
              alt="CrazyNator"
              width={16}
              height={16}
              className="shrink-0 sm:w-[18px] sm:h-[18px]"
            />
            <span className="text-xs sm:text-sm font-medium max-w-[120px] sm:max-w-none truncate">
              {project.name}
            </span>
            <ChevronDownIcon className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuItem asChild>
            <Link href="/">
              <ChevronLeftIcon className="size-4" />
              <span>Go to Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <DownloadIcon className="size-4" />
              <span>Download Project</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem 
                  onClick={handleDownloadSourceCode} 
                  disabled={downloadZip.isPending}
                  className="gap-2"
                >
                  {downloadZip.isPending ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : (
                    <CodeIcon className="size-4" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {downloadZip.isPending ? 'Preparing...' : 'Source Code Only'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Generated files from database (~few KB)
                    </span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleDownloadFullProject} 
                  disabled={downloadFullProject.isPending}
                  className="gap-2"
                >
                  {downloadFullProject.isPending ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : (
                    <FileArchiveIcon className="size-4" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {downloadFullProject.isPending ? 'Preparing...' : 'Complete Project'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Full project from sandbox (ready to run locally)
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <SunMoonIcon className="text-muted-foreground size-4" />
              <span>Appearance</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
                  <DropdownMenuRadioItem value="light">
                    <span>Light</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <span>Dark</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    <span>System</span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex items-center gap-2 px-2 sm:px-3 pl-1 sm:pl-2">
        {/* GitHub Sync Status */}
        <div className="hidden sm:block">
          <GitHubSyncStatus projectId={projectId} />
        </div>
        
        {/* Create Repository Dialog */}
        <div className="hidden sm:block">
          <CreateRepositoryDialog 
            projectId={projectId} 
            projectName={project.name}
          />
        </div>
        
        <InngestConnectionStatus
          status={
            realtimeConnectionState === InngestSubscriptionState.Connecting ||
            realtimeConnectionState === InngestSubscriptionState.RefreshingToken
              ? 'connecting'
              : realtimeConnectionState === InngestSubscriptionState.Active
                ? 'connected'
                : 'disconnected'
          }
        >
          <InngestConnectionStatusIndicator />
          <InngestConnectionStatusLabel className="hidden sm:inline" />
        </InngestConnectionStatus>
      </div>
    </header>
  );
};
