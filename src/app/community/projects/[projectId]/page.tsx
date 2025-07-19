import { CommunityProjectDetailView } from '@/modules/community/ui/views/community-project-detail-view';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

interface CommunityProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function CommunityProjectPage({ params }: CommunityProjectPageProps) {
  const { projectId } = await params;
  const queryClient = getQueryClient();
  
  // Pre-fetch community project data
  // This would need to be implemented in the tRPC router
  try {
    // void queryClient.prefetchQuery(
    //   trpc.community.getProject.queryOptions({
    //     id: projectId,
    //   }),
    // );
  } catch (error) {
    // If project doesn't exist, show 404
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<p>Error loading project</p>}>
        <Suspense fallback={<div>Loading project...</div>}>
          <CommunityProjectDetailView projectId={projectId} />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}