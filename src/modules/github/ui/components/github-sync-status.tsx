'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle2, Clock, GitBranch, Github, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface GitHubSyncStatusProps {
  projectId: string;
}

export function GitHubSyncStatus({ projectId }: GitHubSyncStatusProps) {
  const trpc = useTRPC();
  const { data: repository, refetch } = useQuery(trpc.github.getRepositoryByProject.queryOptions({ projectId }));

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
    refetch();
    toast.success('Repository status refreshed');
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
                <p className="text-xs text-red-600">
                  Error: {repository.syncError}
                </p>
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
                onClick={handleRefresh}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Refresh sync status
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
            <TooltipContent>
              Open repository on GitHub
            </TooltipContent>
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
  const { data: repository } = useQuery(trpc.github.getRepositoryByProject.queryOptions({ projectId }));

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
            <Github className="h-3 w-3" />
            {getSyncStatusIcon(repository.syncStatus)}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1">
            <p className="text-xs font-medium">GitHub: {repository.name}</p>
            <p className="text-xs text-muted-foreground">
              {repository.syncStatus === 'SUCCESS' && repository.lastSyncAt
                ? `Synced ${new Date(repository.lastSyncAt).toLocaleString()}`
                : `Status: ${repository.syncStatus}`
              }
            </p>
            {repository.syncError && (
              <p className="text-xs text-red-600">
                Error: {repository.syncError}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}