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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronLeftIcon, SunMoonIcon, GitForkIcon } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
interface Props {
  projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const [isForking, setIsForking] = useState(false);
  const [showForkDialog, setShowForkDialog] = useState(false);

  const trpc = useTRPC();
  const { data: project } = useSuspenseQuery(trpc.projects.getOne.queryOptions({ id: projectId }));
  const { state: realtimeConnectionState } = useInngest();

  const forkProjectMutation = trpc.projects.forkProject.useMutation({
    onSuccess: (forkedProject) => {
      toast.success('Project forked successfully! Opening the new project...');
      // Redirect to the new forked project
      setTimeout(() => {
        router.push(`/projects/${forkedProject.id}`);
      }, 1000);
    },
    onError: (error) => {
      console.error('Failed to fork project:', error);
      toast.error('Failed to fork project. Please try again.');
    },
    onSettled: () => {
      setIsForking(false);
    },
  });

  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

  const handleForkProject = () => {
    setShowForkDialog(true);
  };

  const confirmFork = () => {
    setShowForkDialog(false);
    setIsForking(true);
    forkProjectMutation.mutate({ projectId });
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
          <DropdownMenuItem 
            onClick={handleForkProject}
            disabled={isForking}
          >
            <GitForkIcon className="size-4" />
            <span>{isForking ? 'Forking...' : 'Fork Project'}</span>
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

      <AlertDialog open={showForkDialog} onOpenChange={setShowForkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fork Project</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a copy of "{project.name}" with all messages and code fragments. 
              You'll be redirected to the new project where you can continue working independently.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFork} disabled={isForking}>
              {isForking ? 'Forking...' : 'Fork Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};
