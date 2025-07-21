'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, LoaderIcon } from 'lucide-react';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Plan, Subscription } from '@/generated/prisma';
import { PlanLimits } from '@/lib/stripe-service';

interface PricingTableProps {
  currentSubscription?: (Subscription & { plan: Plan; usageRecords: unknown[] }) | null;
}

export function PricingTable({ currentSubscription }: PricingTableProps) {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const trpc = useTRPC();

  const { data: plans, isLoading } = useQuery(
    trpc.billing.getPlans.queryOptions()
  );
  const createCheckoutMutation = useMutation(
    trpc.billing.createCheckout.mutationOptions({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message);
      setLoadingPlanId(null);
    },
    })
  );
  
  const createFreeSubscriptionMutation = useMutation(
    trpc.billing.createFreeSubscription.mutationOptions({
    onSuccess: () => {
      toast.success('Free plan activated successfully!');
      setLoadingPlanId(null);
      // Refresh the page to update the subscription status
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
      setLoadingPlanId(null);
    },
    })
  );

  const handleSelectPlan = async (priceId: string, planId: string, price: number) => {
    if (currentSubscription?.planId === planId) {
      return; // Already on this plan
    }

    setLoadingPlanId(planId);
    
    try {
      if (price === 0) {
        // Para planos gratuitos, criar subscription diretamente
        await createFreeSubscriptionMutation.mutateAsync({ planId });
      } else {
        // Para planos pagos, usar checkout do Stripe
        await createCheckoutMutation.mutateAsync({ priceId });
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderIcon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No plans available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
      {plans.map((plan) => {
        const features = plan.features as PlanLimits;
        const isCurrentPlan = currentSubscription?.planId === plan.id;
        const isLoading = loadingPlanId === plan.id;
        
        return (
          <Card key={plan.id} className={`relative ${isCurrentPlan ? 'border-primary' : ''}`}>
            {isCurrentPlan && (
              <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground">
                Current Plan
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">${(plan.price / 100).toFixed(2)}</span>
                  <span className="text-muted-foreground">/{plan.interval}</span>
                </div>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {Object.entries(features).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {value === -1 ? 'Unlimited' : value.toLocaleString()} {formatResourceName(key)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
            
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleSelectPlan(plan.stripePriceId, plan.id, plan.price)}
                disabled={isCurrentPlan || isLoading}
                variant={isCurrentPlan ? 'outline' : 'default'}
              >
                {isLoading ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isCurrentPlan ? (
                  'Current Plan'
                ) : (
                  `Get ${plan.name}`
                )}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

function formatResourceName(key: string): string {
  const formatMap: Record<string, string> = {
    projects: 'projects',
    apiCalls: 'API calls',
    storage: 'MB storage',
  };
  
  return formatMap[key] || key;
}