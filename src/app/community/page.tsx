import { CommunityProjectsView } from '@/modules/community/ui/views/community-projects-view';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';

export default async function CommunityPage() {
  const queryClient = getQueryClient();
  
  // Pre-fetch community projects if we have that query
  // This would need to be implemented in the tRPC router
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<p>Error loading community projects</p>}>
        <Suspense fallback={<div>Loading community projects...</div>}>
          <CommunityProjectsView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}