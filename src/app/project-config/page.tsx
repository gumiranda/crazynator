import ProjectConfig from '@/components/project-config';

export default function ProjectConfigPage() {
  // In a real app, this would come from the URL params or user session
  const projectId = 'demo-project-123';
  const projectName = 'Crazy Code Project';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <ProjectConfig 
          projectId={projectId}
          projectName={projectName}
          packageManager="npm"
        />
      </div>
    </div>
  );
}