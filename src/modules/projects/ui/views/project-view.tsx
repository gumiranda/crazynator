'use client';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { MessagesContainer } from '../components/messages-container';
import { Suspense, useState, useEffect } from 'react';
import { Fragment } from '@/generated/prisma';
import { ProjectHeader } from '../components/project-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CrownIcon, EyeIcon, CodeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import FragmentPreview from '../components/fragment-preview';
import FileExplore from '@/components/file-explore';
import type { FileCollection } from '@/types/files';
import UserControl from '@/components/user-control';
import { useAuth } from '@clerk/nextjs';
import { ErrorBoundary } from 'react-error-boundary';
import { InngestProvider } from '@/components/ui/inngest-provider';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface Props {
  projectId: string;
}

export const ProjectView = ({ projectId }: Props) => {
  const { has } = useAuth();
  const hasProAccess = has?.({ plan: 'pro' });
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Handle fragment selection on mobile - open sheet automatically
  const handleFragmentSelect = (fragment: Fragment | null) => {
    setActiveFragment(fragment);
    if (fragment && isMobile) {
      setIsMobileSheetOpen(true);
    }
  };

  return (
    <div className="h-screen">
      {/* Mobile Layout */}
      <div className="flex flex-col h-full md:hidden relative">
        <InngestProvider projectId={projectId}>
          <Suspense fallback={<div>Loading project...</div>}>
            <ErrorBoundary fallback={<div>Error loading project...</div>}>
              <ProjectHeader projectId={projectId} />
            </ErrorBoundary>
          </Suspense>

          {/* Full-screen chat on mobile */}
          <div className="flex-1 min-h-0">
            <Suspense fallback={<div>Loading messages...</div>}>
              <ErrorBoundary fallback={<div>Error loading messages...</div>}>
                <MessagesContainer
                  projectId={projectId}
                  activeFragment={activeFragment}
                  setActiveFragment={handleFragmentSelect}
                />
              </ErrorBoundary>
            </Suspense>
          </div>

          {/* Floating Action Button - Show when fragment exists but sheet is closed */}
          {activeFragment && !isMobileSheetOpen && (
            <div className="absolute bottom-20 right-4 z-20">
              <Button
                onClick={() => setIsMobileSheetOpen(true)}
                size="lg"
                className="rounded-full h-12 w-12 shadow-lg"
              >
                <EyeIcon className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Mobile Sheet for Preview/Code */}
          <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
            <SheetContent side="top" className="h-[85vh] p-0">
              <div className="flex flex-col h-full">
                <SheetHeader className="px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-base font-medium">
                      {activeFragment?.title || 'Fragment Preview'}
                    </SheetTitle>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Tabs
                      value={activeTab}
                      onValueChange={(value) => setActiveTab(value as 'preview' | 'code')}
                      className="w-full"
                    >
                      <div className="flex items-center justify-between">
                        <TabsList className="h-8 rounded-md border p-0">
                          <TabsTrigger value="preview" className="rounded-md text-xs px-3">
                            <EyeIcon className="h-3 w-3 mr-1" />
                            <span>Preview</span>
                          </TabsTrigger>
                          <TabsTrigger value="code" className="rounded-md text-xs px-3">
                            <CodeIcon className="h-3 w-3 mr-1" />
                            <span>Code</span>
                          </TabsTrigger>
                        </TabsList>
                        <div className="flex items-center gap-2">
                          {!hasProAccess && (
                            <Button variant="tertiary" size="sm" asChild>
                              <Link href={`/projects/${projectId}`}>
                                <CrownIcon className="h-3 w-3 mr-1" />
                                <span className="text-xs">Pro</span>
                              </Link>
                            </Button>
                          )}
                          <UserControl />
                        </div>
                      </div>
                    </Tabs>
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden">
                  {activeFragment && (
                    <Tabs value={activeTab} className="h-full">
                      <TabsContent value="preview" className="h-full m-0">
                        <FragmentPreview fragment={activeFragment} />
                      </TabsContent>
                      <TabsContent value="code" className="h-full m-0">
                        <FileExplore
                          files={activeFragment.files as FileCollection}
                          fragmentId={activeFragment.id}
                          readOnly={false}
                        />
                      </TabsContent>
                    </Tabs>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </InngestProvider>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block h-full">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={35} minSize={20} className="flex flex-col min-h-0">
            <InngestProvider projectId={projectId}>
              <Suspense fallback={<div>Loading project...</div>}>
                <ErrorBoundary fallback={<div>Error loading project...</div>}>
                  <ProjectHeader projectId={projectId} />
                </ErrorBoundary>
              </Suspense>
              <Suspense fallback={<div>Loading messages...</div>}>
                <ErrorBoundary fallback={<div>Error loading messages...</div>}>
                  <MessagesContainer
                    projectId={projectId}
                    activeFragment={activeFragment}
                    setActiveFragment={setActiveFragment}
                  />
                </ErrorBoundary>
              </Suspense>
            </InngestProvider>
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
                {!!activeFragment && (
                  <FileExplore
                    files={activeFragment.files as FileCollection}
                    fragmentId={activeFragment.id}
                    readOnly={false}
                  />
                )}
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};
