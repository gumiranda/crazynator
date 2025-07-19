'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Package, Camera, FileText, Download, Folder } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import EnvConfig from './env-config';
import LibraryInstaller from './library-installer';
import PhotoUpload from './photo-upload';

interface ProjectConfigProps {
  projectId: string;
  projectName?: string;
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
}

interface EnvVariable {
  key: string;
  value: string;
  description?: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'url' | 'secret';
}

interface Library {
  name: string;
  version?: string;
  description?: string;
  isDev?: boolean;
  isInstalled?: boolean;
  category?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnail?: string;
  uploadedAt: Date;
  tags?: string[];
  description?: string;
}

export default function ProjectConfig({ 
  projectId, 
  projectName = 'My Project',
  packageManager = 'npm' 
}: ProjectConfigProps) {
  const [activeTab, setActiveTab] = useState('environment');
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [selectedLibraries, setSelectedLibraries] = useState<Library[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleEnvSave = (newEnvVars: EnvVariable[]) => {
    setEnvVars(newEnvVars);
    console.log('Environment variables saved:', newEnvVars);
  };

  const handleLibraryInstall = async (libraries: Library[]) => {
    setSelectedLibraries(libraries);
    console.log('Libraries to install:', libraries);
    
    // Here you would typically call an API to actually install the libraries
    // For now, we'll just simulate the process
    toast({
      title: 'Libraries selected',
      description: `${libraries.length} libraries ready for installation.`,
    });
  };

  const handleFileUpload = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    console.log('Files uploaded:', files);
  };

  const handleFileDelete = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    console.log('File deleted:', fileId);
  };

  const generateProjectSetup = async () => {
    if (envVars.length === 0 && selectedLibraries.length === 0) {
      toast({
        title: 'No configuration to generate',
        description: 'Please configure environment variables or select libraries first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate project setup files
      const setupFiles = [];

      // Generate .env file
      if (envVars.length > 0) {
        const envContent = envVars
          .map(envVar => {
            const comment = envVar.description ? `# ${envVar.description}\n` : '';
            const required = envVar.required ? '# Required' : '# Optional';
            return `${comment}${required}\n${envVar.key}=${envVar.value}\n`;
          })
          .join('\n');
        
        setupFiles.push({
          name: '.env',
          content: envContent,
          type: 'text/plain'
        });
      }

      // Generate package.json updates
      if (selectedLibraries.length > 0) {
        const prodDeps: { [key: string]: string } = {};
        const devDeps: { [key: string]: string } = {};

        selectedLibraries.forEach(lib => {
          const version = lib.version || 'latest';
          const formattedVersion = version.startsWith('^') || version.startsWith('~') ? version : `^${version}`;
          
          if (lib.isDev) {
            devDeps[lib.name] = formattedVersion;
          } else {
            prodDeps[lib.name] = formattedVersion;
          }
        });

        const packageUpdates = {
          dependencies: Object.keys(prodDeps).length > 0 ? prodDeps : undefined,
          devDependencies: Object.keys(devDeps).length > 0 ? devDeps : undefined,
        };

        setupFiles.push({
          name: 'package-updates.json',
          content: JSON.stringify(packageUpdates, null, 2),
          type: 'application/json'
        });

        // Generate installation commands
        const installCommands = [];
        if (Object.keys(prodDeps).length > 0) {
          const libs = Object.keys(prodDeps).join(' ');
          switch (packageManager) {
            case 'npm':
              installCommands.push(`npm install ${libs}`);
              break;
            case 'yarn':
              installCommands.push(`yarn add ${libs}`);
              break;
            case 'pnpm':
              installCommands.push(`pnpm add ${libs}`);
              break;
            case 'bun':
              installCommands.push(`bun add ${libs}`);
              break;
          }
        }

        if (Object.keys(devDeps).length > 0) {
          const libs = Object.keys(devDeps).join(' ');
          switch (packageManager) {
            case 'npm':
              installCommands.push(`npm install --save-dev ${libs}`);
              break;
            case 'yarn':
              installCommands.push(`yarn add --dev ${libs}`);
              break;
            case 'pnpm':
              installCommands.push(`pnpm add --save-dev ${libs}`);
              break;
            case 'bun':
              installCommands.push(`bun add --dev ${libs}`);
              break;
          }
        }

        setupFiles.push({
          name: 'install-commands.sh',
          content: installCommands.join('\n'),
          type: 'text/plain'
        });
      }

      // Generate README with setup instructions
      const readmeContent = `# ${projectName} - Setup Instructions

## Environment Variables
${envVars.length > 0 ? `
Copy the \`.env\` file to your project root and update the values as needed.

Required environment variables:
${envVars.filter(v => v.required).map(v => `- \`${v.key}\`: ${v.description || 'No description'}`).join('\n')}

Optional environment variables:
${envVars.filter(v => !v.required).map(v => `- \`${v.key}\`: ${v.description || 'No description'}`).join('\n')}
` : 'No environment variables configured.'}

## Dependencies
${selectedLibraries.length > 0 ? `
Run the following commands to install the required dependencies:

\`\`\`bash
${packageManager === 'npm' ? 'npm install' : packageManager === 'yarn' ? 'yarn install' : packageManager === 'pnpm' ? 'pnpm install' : 'bun install'}
\`\`\`

Selected libraries:
${selectedLibraries.map(lib => `- \`${lib.name}\`${lib.version && lib.version !== 'latest' ? `@${lib.version}` : ''}: ${lib.description || 'No description'}`).join('\n')}
` : 'No additional libraries selected.'}

## Assets
${uploadedFiles.length > 0 ? `
The following files have been uploaded to your project:
${uploadedFiles.map(file => `- ${file.name} (${(file.size / 1024).toFixed(1)} KB)`).join('\n')}
` : 'No files uploaded.'}

## Getting Started

1. Copy the \`.env\` file to your project root
2. Install dependencies using the provided commands
3. Update environment variables with your actual values
4. Start your development server

Happy coding! 🚀
`;

      setupFiles.push({
        name: 'SETUP.md',
        content: readmeContent,
        type: 'text/markdown'
      });

      // Create and download ZIP file with all setup files
      // For demo purposes, we'll just show the files that would be generated
      toast({
        title: 'Project setup generated',
        description: `Generated ${setupFiles.length} configuration files.`,
      });

      // In a real implementation, you would create a ZIP file and trigger download
      console.log('Generated setup files:', setupFiles);

    } catch (error) {
      toast({
        title: 'Generation failed',
        description: 'Failed to generate project setup files.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getTabBadgeCount = (tab: string) => {
    switch (tab) {
      case 'environment':
        return envVars.length;
      case 'libraries':
        return selectedLibraries.length;
      case 'uploads':
        return uploadedFiles.length;
      default:
        return 0;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Project Configuration
              </CardTitle>
              <CardDescription>
                Configure your project environment, install libraries, and manage assets
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{projectName}</Badge>
              <Button onClick={generateProjectSetup} disabled={isGenerating}>
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Generate Setup
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="environment" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Environment
            {getTabBadgeCount('environment') > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTabBadgeCount('environment')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="libraries" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Libraries
            {getTabBadgeCount('libraries') > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTabBadgeCount('libraries')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="uploads" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Assets
            {getTabBadgeCount('uploads') > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTabBadgeCount('uploads')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="environment" className="mt-6">
          <EnvConfig
            projectId={projectId}
            onSave={handleEnvSave}
            initialEnvVars={envVars}
          />
        </TabsContent>

        <TabsContent value="libraries" className="mt-6">
          <LibraryInstaller
            projectId={projectId}
            packageManager={packageManager}
            onInstall={handleLibraryInstall}
            initialLibraries={selectedLibraries}
          />
        </TabsContent>

        <TabsContent value="uploads" className="mt-6">
          <PhotoUpload
            projectId={projectId}
            onUpload={handleFileUpload}
            onDelete={handleFileDelete}
            initialFiles={uploadedFiles}
          />
        </TabsContent>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Environment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5" />
                  Environment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {envVars.length} variables configured
                  </p>
                  {envVars.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Required:</p>
                      <div className="flex flex-wrap gap-1">
                        {envVars.filter(v => v.required).slice(0, 3).map(envVar => (
                          <Badge key={envVar.key} variant="destructive" className="text-xs">
                            {envVar.key}
                          </Badge>
                        ))}
                        {envVars.filter(v => v.required).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{envVars.filter(v => v.required).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Libraries Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5" />
                  Libraries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {selectedLibraries.length} libraries selected
                  </p>
                  {selectedLibraries.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {selectedLibraries.slice(0, 3).map(lib => (
                          <Badge key={lib.name} variant="outline" className="text-xs">
                            {lib.name}
                          </Badge>
                        ))}
                        {selectedLibraries.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{selectedLibraries.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assets Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="w-5 h-5" />
                  Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {uploadedFiles.length} files uploaded
                  </p>
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Total size: {(uploadedFiles.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Setup Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Project Setup</CardTitle>
              <CardDescription>
                Generate configuration files and setup instructions for your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    Ready to generate setup files with {envVars.length + selectedLibraries.length + uploadedFiles.length} configured items
                  </p>
                </div>
                <Button onClick={generateProjectSetup} disabled={isGenerating} size="lg">
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Generating Setup...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download Project Setup
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}