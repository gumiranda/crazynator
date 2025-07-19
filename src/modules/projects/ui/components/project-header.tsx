import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
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
import { ChevronDownIcon, ChevronLeftIcon, SunMoonIcon, DownloadIcon } from 'lucide-react';
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
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
  const { setTheme, theme } = useTheme();
  const [isDownloading, setIsDownloading] = useState(false);

  const trpc = useTRPC();
  const { data: project } = useSuspenseQuery(trpc.projects.getOne.queryOptions({ id: projectId }));
  const { state: realtimeConnectionState } = useInngest();

  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/download`);
      
      if (!response.ok) {
        throw new Error('Falha ao baixar o projeto');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${project.name}-project.zip`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Projeto baixado com sucesso!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erro ao baixar o projeto. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
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
            <Image src="/logo.svg" alt="Crazy Code" width={16} height={16} className="shrink-0 sm:w-[18px] sm:h-[18px]" />
            <span className="text-xs sm:text-sm font-medium max-w-[120px] sm:max-w-none truncate">{project.name}</span>
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
          <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
            <DownloadIcon className="size-4" />
            <span>{isDownloading ? 'Baixando...' : 'Baixar Projeto (ZIP)'}</span>
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
      <div className="px-2 sm:px-3 pl-1 sm:pl-2">
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
