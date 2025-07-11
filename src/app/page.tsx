import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import ClientComponent from './client';
import { Suspense } from 'react';

export default async function Home() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.devDoido.queryOptions({ text: 'falaaa dev doido PREFETCH' }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <ClientComponent />
      </Suspense>
    </HydrationBoundary>
  );
}
