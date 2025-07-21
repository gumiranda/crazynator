'use client';

import { SubscriptionDashboard } from '@/modules/billing/ui/components/subscription-dashboard';

export default function SubscriptionPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing settings
          </p>
        </div>
        
        <SubscriptionDashboard />
      </div>
    </div>
  );
}