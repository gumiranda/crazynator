'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  GitBranch,
  Loader2,
  ExternalLink,
  RefreshCw,
  Upload,
  Github,
} from 'lucide-react';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface GitHubSyncStatusProps {
  projectId: string;
}

export function GitHubSyncStatus({ projectId }: GitHubSyncStatusProps) {
  const trpc = useTRPC();
  const { data: repository, refetch } = useQuery(
    trpc.github.getRepositoryByProject.queryOptions({ projectId }),
  );

  // Sync all files from sandbox mutation
  const syncFullProject = useMutation(
    trpc.projects.syncFullProjectToGitHub.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Started sync of ${data.fileCount} files to ${data.repository}`, {
          description: 'GitHub sync is running in the background. Check status for updates.',
        });
        // Refresh repository status after a short delay
        setTimeout(() => refetch(), 1000);
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to sync full project to GitHub');
      },
    }),
  );

  // Pull changes from GitHub mutation
  const pullFromGitHub = useMutation(
    trpc.projects.pullFromGitHub.mutationOptions({
      onSuccess: (data) => {
        const { stats } = data;
        if (stats.newFiles > 0 || stats.updatedFiles > 0) {
          toast.success(
            `Pulled ${stats.processedFiles} files from GitHub`,
            {
              description: `${stats.newFiles} new files, ${stats.updatedFiles} updated files${stats.sandboxUpdated ? ' (sandbox updated)' : ' (fragment updated)'}`,
            }
          );
        } else {
          toast.success('Repository is up to date', {
            description: 'No changes found in GitHub repository',
          });
        }
        // Refresh repository status
        refetch();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to pull changes from GitHub');
      },
    }),
  );

  if (!repository) {
    return null;
  }

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'FAILED':
        return <AlertCircle className="h-3 w-3" />;
      case 'IN_PROGRESS':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'PENDING':
        return <Clock className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getSyncStatusText = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'Synced';
      case 'FAILED':
        return 'Sync Failed';
      case 'IN_PROGRESS':
        return 'Syncing...';
      case 'PENDING':
        return 'Sync Pending';
      default:
        return 'Unknown';
    }
  };

  const handleRefresh = () => {
    // Pull changes from GitHub instead of just refreshing status
    pullFromGitHub.mutate({ projectId });
  };

  const handleSyncFullProject = () => {
    syncFullProject.mutate({ projectId });
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Github className="h-4 w-4 text-muted-foreground" />
              <Badge
                variant="outline"
                className={`${getSyncStatusColor(repository.syncStatus)} flex items-center gap-1`}
              >
                {getSyncStatusIcon(repository.syncStatus)}
                {getSyncStatusText(repository.syncStatus)}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">GitHub Repository: {repository.name}</p>
              <p className="text-xs text-muted-foreground">{repository.fullName}</p>
              {repository.lastSyncAt && (
                <p className="text-xs text-muted-foreground">
                  Last synced: {new Date(repository.lastSyncAt).toLocaleString()}
                </p>
              )}
              {repository.syncError && (
                <p className="text-xs text-red-600">Error: {repository.syncError}</p>
              )}
              <div className="flex items-center gap-1 pt-1">
                <GitBranch className="h-3 w-3" />
                <span className="text-xs">{repository.defaultBranch}</span>
                <span className="text-xs mx-1">•</span>
                <span className="text-xs">{repository.isPrivate ? 'Private' : 'Public'}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSyncFullProject}
                disabled={syncFullProject.isPending || repository.syncStatus === 'IN_PROGRESS'}
                className="h-6 w-6 p-0"
              >
                {syncFullProject.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sync all files from sandbox</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={pullFromGitHub.isPending}
                className="h-6 w-6 p-0"
              >
                {pullFromGitHub.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Pull changes from GitHub to sandbox and fragment
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(repository.htmlUrl, '_blank')}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open repository on GitHub</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

interface CompactGitHubSyncStatusProps {
  projectId: string;
}

export function CompactGitHubSyncStatus({ projectId }: CompactGitHubSyncStatusProps) {
  const trpc = useTRPC();
  const { data: repository } = useQuery(
    trpc.github.getRepositoryByProject.queryOptions({ projectId }),
  );

  if (!repository) {
    return null;
  }

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-600';
      case 'FAILED':
        return 'text-red-600';
      case 'IN_PROGRESS':
        return 'text-blue-600';
      case 'PENDING':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'FAILED':
        return <AlertCircle className="h-3 w-3" />;
      case 'IN_PROGRESS':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'PENDING':
        return <Clock className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 ${getSyncStatusColor(repository.syncStatus)}`}>
            <Github className="h-4 w-4" />
            {getSyncStatusIcon(repository.syncStatus)}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1">
            <p className="text-xs font-medium">GitHub: {repository.name}</p>
            <p className="text-xs text-muted-foreground">
              {repository.syncStatus === 'SUCCESS' && repository.lastSyncAt
                ? `Synced ${new Date(repository.lastSyncAt).toLocaleString()}`
                : `Status: ${repository.syncStatus}`}
            </p>
            {repository.syncError && (
              <p className="text-xs text-red-600">Error: {repository.syncError}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
