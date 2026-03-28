'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GitBranchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Loader2Icon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
} from 'lucide-react';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface GitHubSyncPanelProps {
  projectId: string;
}

export const GitHubSyncPanel = ({ projectId }: GitHubSyncPanelProps) => {
  const [syncJobId, setSyncJobId] = useState<string | null>(null);
  const trpc = useTRPC();

  // Get connected repo for this project
  const { data: repo, isLoading: repoLoading } = useQuery(
    trpc.github.getRepositoryByProject.queryOptions({ projectId }),
  );

  // Get GitHub connection status
  const { data: connection } = useQuery(trpc.github.getConnection.queryOptions());

  // Pull from GitHub
  const pullMutation = useMutation(
    trpc.github.pullFromGitHub.mutationOptions({
      onSuccess: (data) => {
        setSyncJobId(data.syncJobId);
        toast.success('Pull sync started');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  // Push to GitHub
  const pushMutation = useMutation(
    trpc.github.pushToGitHub.mutationOptions({
      onSuccess: () => {
        toast.success('Push sync started');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  // Poll sync status if we have an active job
  const { data: syncJob } = useQuery({
    ...trpc.github.getSyncStatus.queryOptions({ syncJobId: syncJobId || '' }),
    enabled: !!syncJobId,
    refetchInterval: syncJobId ? 2000 : false,
  });

  // Stop polling when job completes
  if (syncJob && (syncJob.status === 'COMPLETED' || syncJob.status === 'FAILED')) {
    if (syncJobId) {
      setTimeout(() => setSyncJobId(null), 3000);
    }
  }

  if (repoLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <GitBranchIcon className="h-12 w-12 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h3 className="font-semibold">Connect GitHub</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Connect your GitHub account to enable full duplex sync between your project and a
            repository.
          </p>
        </div>
        <Button asChild>
          <a href="/api/auth/github">Connect GitHub</a>
        </Button>
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <GitBranchIcon className="h-12 w-12 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h3 className="font-semibold">No Repository Linked</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Create or link a GitHub repository to enable bidirectional sync. Push your code to
            GitHub and pull changes back.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Connected as <strong>@{connection.githubUsername}</strong>
        </p>
      </div>
    );
  }

  const isSyncing = pullMutation.isPending || pushMutation.isPending || !!syncJobId;

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Repository Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitBranchIcon className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">{repo.fullName}</CardTitle>
                <CardDescription className="text-xs">
                  {repo.isPrivate ? 'Private' : 'Public'} &middot; {repo.defaultBranch}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  repo.syncStatus === 'SUCCESS'
                    ? 'default'
                    : repo.syncStatus === 'FAILED'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {repo.syncStatus === 'SUCCESS' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                {repo.syncStatus === 'FAILED' && <XCircleIcon className="h-3 w-3 mr-1" />}
                {repo.syncStatus}
              </Badge>
              <Button variant="ghost" size="icon" asChild>
                <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {repo.lastSyncAt && (
            <p className="text-xs text-muted-foreground">
              Last synced: {new Date(repo.lastSyncAt).toLocaleString()}
            </p>
          )}
          {repo.syncError && (
            <p className="text-xs text-destructive mt-1">Error: {repo.syncError}</p>
          )}
        </CardContent>
      </Card>

      {/* Sync Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowDownIcon className="h-4 w-4" />
              Pull from GitHub
            </CardTitle>
            <CardDescription className="text-xs">
              Download latest files from GitHub into your sandbox
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              disabled={isSyncing}
              onClick={() => pullMutation.mutate({ projectId })}
            >
              {pullMutation.isPending ? (
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-2" />
              )}
              Pull
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowUpIcon className="h-4 w-4" />
              Push to GitHub
            </CardTitle>
            <CardDescription className="text-xs">
              Upload sandbox files to GitHub repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              disabled={isSyncing}
              onClick={() => pushMutation.mutate({ projectId })}
            >
              {pushMutation.isPending ? (
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowUpIcon className="h-4 w-4 mr-2" />
              )}
              Push
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sync Progress */}
      {syncJob && syncJobId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCwIcon
                className={`h-4 w-4 ${syncJob.status === 'PROCESSING' ? 'animate-spin' : ''}`}
              />
              Sync Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>{syncJob.type === 'PULL_FROM_GITHUB' ? 'Pulling' : 'Pushing'}...</span>
              <Badge variant={syncJob.status === 'COMPLETED' ? 'default' : 'secondary'}>
                {syncJob.status}
              </Badge>
            </div>
            {syncJob.totalFiles > 0 && (
              <>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.round((syncJob.processedFiles / syncJob.totalFiles) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {syncJob.processedFiles}/{syncJob.totalFiles} files
                  {syncJob.failedFiles > 0 && ` (${syncJob.failedFiles} failed)`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
