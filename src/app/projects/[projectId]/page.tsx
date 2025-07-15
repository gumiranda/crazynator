import { ProjectView } from '@/modules/projects/ui/views/project-view';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.messages.getMany.queryOptions({
      projectId,
    }),
  );
  void queryClient.prefetchQuery(
    trpc.projects.getOne.queryOptions({
      id: projectId,
    }),
  );
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectView projectId={projectId} />
    </HydrationBoundary>
  );
}
