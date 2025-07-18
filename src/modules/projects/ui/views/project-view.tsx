'use client';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { MessagesContainer } from '../components/messages-container';
import { Suspense, useState } from 'react';
import { Fragment } from '@/generated/prisma';
import { ProjectHeader } from '../components/project-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CrownIcon, EyeIcon } from 'lucide-react';
import { CodeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import FragmentPreview from '../components/fragment-preview';
import FileExplore from '@/components/file-explore';
import type { FileCollection } from '@/types/files';
import UserControl from '@/components/user-control';
import { useAuth } from '@clerk/nextjs';
import { ErrorBoundary } from 'react-error-boundary';

interface Props {
  projectId: string;
}

export const ProjectView = ({ projectId }: Props) => {
  const { has } = useAuth();
  const hasProAccess = has?.({ plan: 'pro' });
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={35} minSize={20} className="flex flex-col min-h-0">
          <ErrorBoundary fallbackRender={({ error }) => <div>{error.message}</div>}>
            <Suspense fallback={<p>Loading...</p>}>
              <ProjectHeader projectId={projectId} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary fallbackRender={({ error }) => <div>{error.message}</div>}>
            <Suspense fallback={<p>Loading...</p>}>
              <MessagesContainer
                projectId={projectId}
                activeFragment={activeFragment}
                setActiveFragment={setActiveFragment}
              />
            </Suspense>
          </ErrorBoundary>
        </ResizablePanel>
        <ResizableHandle className="hover:bg-primary/10 transition-colors" />
        <ResizablePanel defaultSize={70} minSize={50} className="flex min-h-0 flex-col">
          <Tabs
            defaultValue="preview"
            className="h-full gap-y-0"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'preview' | 'code')}
          >
            <div className="flex w-full items-center gap-x-2 border-b p-2">
              <TabsList className="h-8 rounded-md border p-0">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon className="h-4 w-4" />
                  <span>Preview</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon className="h-4 w-4" />
                  <span>Code</span>
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-x-2">
                {!hasProAccess && (
                  <Button variant="tertiary" size="sm" asChild>
                    <Link href={`/projects/${projectId}`}>
                      <CrownIcon className="h-4 w-4" />
                      <span>Upgrade</span>
                    </Link>
                  </Button>
                )}
                <UserControl />
              </div>
            </div>
            <TabsContent value="preview">
              {!!activeFragment && <FragmentPreview fragment={activeFragment} />}
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
              {!!activeFragment && <FileExplore files={activeFragment.files as FileCollection} />}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
