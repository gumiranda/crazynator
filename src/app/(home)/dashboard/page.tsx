'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Interface is no longer needed as we use Prisma type directly

function DashboardContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: subscriptionData } = useSuspenseQuery(trpc.subscription.getCurrent.queryOptions());
  
  const cancelSubscriptionMutation = useMutation({
    ...trpc.subscription.cancel.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.subscription.getCurrent.queryOptions());
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  return (
    <div className="min-h-screen bg-background-50">
      <div className="container mx-auto px-4 py-8">
        {/* Success Message */}
        {sessionId && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <p className="text-green-800 font-medium">Subscription activated successfully!</p>
              <p className="text-green-600 text-sm">Welcome to MinimalSaaS</p>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mt-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-background-600">Here&apos;s your account summary</p>
        </div>

        {/* Subscription Details */}
        {subscriptionData && (
          <div className="bg-background rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Subscription Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-background-600">Status</p>
                <p className="font-medium capitalize">{subscriptionData.status}</p>
              </div>
              <div>
                <p className="text-sm text-background-600">Auto cancellation</p>
                <p className="font-medium">{subscriptionData.cancelAtPeriodEnd ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-background-600">Created on</p>
                <p className="font-medium">{formatDate(subscriptionData.createdAt.toString())}</p>
              </div>
              <div>
                <p className="text-sm text-background-600">Last updated</p>
                <p className="font-medium">{formatDate(subscriptionData.updatedAt.toString())}</p>
              </div>
              <CustomerPortalButton customerId={subscriptionData.stripeCustomerId} />
              <CancelSubscriptionButton 
                onCancel={() => cancelSubscriptionMutation.mutate({ 
                  stripeSubscriptionId: subscriptionData.stripeSubscriptionId 
                })}
                isLoading={cancelSubscriptionMutation.isPending}
                disabled={subscriptionData.cancelAtPeriodEnd}
              />
            </div>
          </div>
        )}

        {/* No Subscription Message */}
        {!subscriptionData && (
          <div className="bg-background rounded-lg shadow p-6 text-center">
            <AlertCircle className="h-12 w-12 text-background-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active subscription</h3>
            <p className="text-background-600 mb-4">
              You don&apos;t have an active subscription at the moment.
            </p>
            <Button asChild>
              <a href="/pricing">View Plans</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-background-900 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
function CancelSubscriptionButton({ 
  onCancel, 
  isLoading, 
  disabled 
}: { 
  onCancel: () => void; 
  isLoading: boolean; 
  disabled: boolean; 
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleCancel = () => {
    onCancel();
    setShowConfirmation(false);
  };

  if (disabled) {
    return (
      <div className="text-sm text-gray-500">
        Subscription is already scheduled for cancellation
      </div>
    );
  }

  return (
    <div>
      {!showConfirmation ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowConfirmation(true)}
          disabled={isLoading}
        >
          Cancel Subscription
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-background-600">
            Are you sure you want to cancel your subscription?
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? 'Canceling...' : 'Yes, cancel'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmation(false)}
              disabled={isLoading}
            >
              No, keep
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerPortalButton({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePortalAccess = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePortalAccess}
      disabled={loading}
      variant="outline"
      className="border-background-600"
    >
      {loading ? 'Loading...' : '⚙️ Manage Subscription'}
    </Button>
  );
}
