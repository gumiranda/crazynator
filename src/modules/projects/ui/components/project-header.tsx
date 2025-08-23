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
import { ChevronDownIcon, ChevronLeftIcon, SunMoonIcon, DownloadIcon, LoaderIcon } from 'lucide-react';
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

  // Download ZIP mutation
  const downloadZip = useMutation(
    trpc.projects.downloadZip.mutationOptions({
      onSuccess: (data) => {
        // Create blob from base64 data
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

        toast.success(`Downloaded ${data.fileCount} files (${Math.round(data.size / 1024)}KB)`);
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to download project');
      },
    }),
  );

  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

  const handleDownloadZip = () => {
    downloadZip.mutate({ projectId });
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
          <DropdownMenuItem onClick={handleDownloadZip} disabled={downloadZip.isPending}>
            {downloadZip.isPending ? (
              <LoaderIcon className="size-4 animate-spin" />
            ) : (
              <DownloadIcon className="size-4" />
            )}
            <span>{downloadZip.isPending ? 'Preparing download...' : 'Download ZIP'}</span>
          </DropdownMenuItem>
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
