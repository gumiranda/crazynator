'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { LoaderIcon, ExternalLinkIcon, AlertTriangleIcon } from 'lucide-react';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Subscription, Plan } from '@/generated/prisma';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function SubscriptionDashboard() {
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const trpc = useTRPC();

  const { data: subscription, isLoading: subscriptionLoading } = useQuery(
    trpc.billing.getSubscription.queryOptions()
  );
  const { data: usage } = useQuery(
    trpc.billing.getUsage.queryOptions()
  );
  
  const createPortalMutation = useMutation(
    trpc.billing.createPortalSession.mutationOptions({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message);
      setLoadingPortal(false);
    },
    })
  );

  const cancelMutation = useMutation(
    trpc.billing.cancelSubscription.mutationOptions({
    onSuccess: () => {
      toast.success('Subscription will be canceled at the end of the billing period');
      setLoadingCancel(false);
    },
    onError: (error) => {
      toast.error(error.message);
      setLoadingCancel(false);
    },
    })
  );

  const handlePortalAccess = async () => {
    setLoadingPortal(true);
    try {
      await createPortalMutation.mutateAsync();
    } catch (error) {
      console.error('Error accessing portal:', error);
    }
  };

  const handleCancelSubscription = async () => {
    setLoadingCancel(true);
    try {
      await cancelMutation.mutateAsync({ immediately: false });
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderIcon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription. Choose a plan to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/pricing">View Plans</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'CANCELED':
        return 'bg-red-500';
      case 'PAST_DUE':
        return 'bg-yellow-500';
      case 'TRIALING':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'CANCELED':
        return 'Canceled';
      case 'PAST_DUE':
        return 'Past Due';
      case 'TRIALING':
        return 'Trial';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{subscription.plan.name}</CardTitle>
              <CardDescription>
                Your current subscription plan
              </CardDescription>
            </div>
            <Badge className={getStatusColor(subscription.status)}>
              {getStatusText(subscription.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="text-2xl font-bold">
                ${(subscription.plan.price / 100).toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{subscription.plan.interval}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next billing</p>
              <p className="font-medium">
                {subscription.currentPeriodEnd 
                  ? format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')
                  : 'N/A'
                }
              </p>
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <AlertTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Your subscription will be canceled at the end of the current billing period.
              </p>
            </div>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button
              onClick={handlePortalAccess}
              disabled={loadingPortal}
              variant="outline"
            >
              {loadingPortal ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLinkIcon className="mr-2 h-4 w-4" />
                  Manage Subscription
                </>
              )}
            </Button>

            {subscription.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={loadingCancel}>
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {loadingCancel ? (
                        <>
                          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                          Canceling...
                        </>
                      ) : (
                        'Cancel Subscription'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      {usage && usage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <CardDescription>
              Your current usage against plan limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usage.map((item) => (
              <div key={item.resourceType} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{item.resourceType.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span>
                    {item.used.toLocaleString()} / {item.limit === -1 ? 'Unlimited' : item.limit.toLocaleString()}
                  </span>
                </div>
                <Progress 
                  value={item.limit === -1 ? 0 : item.percentage} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}