'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Github, Unlink, AlertCircle } from 'lucide-react';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function GitHubSettings() {
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  const trpc = useTRPC();
  const { data: connection, isLoading, refetch } = useQuery(trpc.github.getConnection.queryOptions());
  const disconnectMutation = useMutation({
    ...trpc.github.disconnect.mutationOptions(),
    onSuccess: () => {
      toast.success('GitHub account disconnected successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to disconnect GitHub account');
    },
    onSettled: () => {
      setIsDisconnecting(false);
    },
  });

  const handleConnect = () => {
    // Redirect to GitHub OAuth endpoint
    window.location.href = '/api/auth/github';
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    disconnectMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to create repositories and sync code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Integration
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to create repositories and sync code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection ? (
          <>
            {/* Connected State */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={connection.avatarUrl || undefined} alt={connection.githubUsername} />
                  <AvatarFallback>
                    <Github className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{connection.githubUsername}</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connected on {new Date(connection.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {connection.profileUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => connection.profileUrl && window.open(connection.profileUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isDisconnecting}>
                      <Unlink className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect GitHub Account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will disconnect your GitHub account and remove all repository links. 
                        Existing repositories on GitHub will not be deleted, but you'll lose the ability 
                        to sync code automatically.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
                        Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <Separator />

            {/* Permissions */}
            <div>
              <h4 className="text-sm font-medium mb-2">Granted Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {connection.scope.split(' ').map((scope) => (
                  <Badge key={scope} variant="outline" className="text-xs">
                    {scope}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Features */}
            <div>
              <h4 className="text-sm font-medium mb-3">Available Features</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Create repositories directly from projects
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Automatic code synchronization
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Real-time sync status updates
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Disconnected State */}
            <div className="text-center py-8">
              <Github className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Connect your GitHub account</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Link your GitHub account to create repositories and automatically sync 
                your generated code to GitHub.
              </p>
              <Button onClick={handleConnect} className="bg-gray-900 hover:bg-gray-800">
                <Github className="h-4 w-4 mr-2" />
                Connect GitHub
              </Button>
            </div>

            <Separator />

            {/* Benefits */}
            <div>
              <h4 className="text-sm font-medium mb-3">What you'll get:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Repository Creation:</strong> Create GitHub repositories directly from your projects
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Automatic Sync:</strong> Changes to your project files are automatically pushed to GitHub
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Version Control:</strong> Full Git history and version tracking for your generated code
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Secure Connection</p>
                  <p className="text-blue-700">
                    We use OAuth 2.0 to securely connect to GitHub. Your credentials are never stored,
                    and you can revoke access at any time from your GitHub account settings.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}