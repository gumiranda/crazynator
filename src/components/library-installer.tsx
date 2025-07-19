'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Download, Copy, Search, Package, Terminal, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Library {
  name: string;
  version?: string;
  description?: string;
  isDev?: boolean;
  isInstalled?: boolean;
  category?: string;
}

interface LibraryInstallerProps {
  projectId: string;
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
  onInstall?: (libraries: Library[]) => void;
  initialLibraries?: Library[];
}

const popularLibraries: { [category: string]: Library[] } = {
  'UI Components': [
    { name: 'shadcn/ui', description: 'Beautiful UI components built with Radix UI and Tailwind CSS' },
    { name: '@mui/material', description: 'Material Design components for React' },
    { name: 'antd', description: 'Enterprise-class UI design solution' },
    { name: 'react-bootstrap', description: 'Bootstrap components for React' },
    { name: 'chakra-ui', description: 'Simple, modular and accessible component library' },
  ],
  'State Management': [
    { name: 'zustand', description: 'Small, fast and scalable state management' },
    { name: '@reduxjs/toolkit', description: 'The official, opinionated, batteries-included toolset for Redux' },
    { name: 'jotai', description: 'Primitive and flexible state management' },
    { name: 'valtio', description: 'Proxy-based state management' },
  ],
  'Forms': [
    { name: 'react-hook-form', description: 'Performant, flexible forms with easy validation' },
    { name: 'formik', description: 'Build forms without tears' },
    { name: '@hookform/resolvers', description: 'Validation resolvers for react-hook-form' },
    { name: 'zod', description: 'TypeScript-first schema validation with static type inference' },
  ],
  'HTTP Clients': [
    { name: 'axios', description: 'Promise based HTTP client' },
    { name: '@tanstack/react-query', description: 'Powerful data synchronization for React' },
    { name: 'swr', description: 'Data fetching library with caching and revalidation' },
    { name: 'ky', description: 'Tiny and elegant HTTP client based on Fetch API' },
  ],
  'Authentication': [
    { name: '@clerk/nextjs', description: 'Authentication and user management for Next.js' },
    { name: 'next-auth', description: 'Complete open source authentication solution' },
    { name: '@auth0/nextjs-auth0', description: 'Auth0 SDK for Next.js' },
    { name: 'firebase', description: 'Firebase SDK for authentication and more' },
  ],
  'Database': [
    { name: '@prisma/client', description: 'Type-safe database client' },
    { name: 'drizzle-orm', description: 'TypeScript ORM for SQL databases' },
    { name: 'mongoose', description: 'MongoDB object modeling' },
    { name: 'pg', description: 'PostgreSQL client for Node.js' },
  ],
  'File Upload': [
    { name: 'react-dropzone', description: 'Simple drag-drop file upload for React' },
    { name: 'multer', description: 'Node.js middleware for handling multipart/form-data' },
    { name: '@uploadthing/react', description: 'File uploads for the modern web' },
    { name: 'cloudinary', description: 'Cloud-based image and video management' },
  ],
  'Utilities': [
    { name: 'lodash', description: 'Modern JavaScript utility library' },
    { name: 'date-fns', description: 'Modern JavaScript date utility library' },
    { name: 'uuid', description: 'RFC4122 (v1, v4, and v5) UUIDs' },
    { name: 'clsx', description: 'Utility for constructing className strings conditionally' },
  ],
  'Development': [
    { name: 'eslint', description: 'Find and fix problems in JavaScript code', isDev: true },
    { name: 'prettier', description: 'Opinionated code formatter', isDev: true },
    { name: 'typescript', description: 'TypeScript language service', isDev: true },
    { name: '@types/node', description: 'TypeScript definitions for Node.js', isDev: true },
  ],
};

export default function LibraryInstaller({ 
  projectId, 
  packageManager = 'npm', 
  onInstall, 
  initialLibraries = [] 
}: LibraryInstallerProps) {
  const [selectedLibraries, setSelectedLibraries] = useState<Library[]>(initialLibraries);
  const [customLibrary, setCustomLibrary] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('popular');
  const [isInstalling, setIsInstalling] = useState(false);
  const { toast } = useToast();

  const categories = Object.keys(popularLibraries);
  const allLibraries = Object.values(popularLibraries).flat();

  const filteredLibraries = allLibraries.filter(lib => {
    const matchesSearch = lib.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lib.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           Object.entries(popularLibraries).find(([cat, libs]) => 
                             cat === selectedCategory && libs.includes(lib)
                           );
    return matchesSearch && matchesCategory;
  });

  const isLibrarySelected = (library: Library) => {
    return selectedLibraries.some(lib => lib.name === library.name);
  };

  const toggleLibrary = (library: Library) => {
    if (isLibrarySelected(library)) {
      setSelectedLibraries(prev => prev.filter(lib => lib.name !== library.name));
    } else {
      setSelectedLibraries(prev => [...prev, { ...library, version: 'latest' }]);
    }
  };

  const addCustomLibrary = () => {
    if (!customLibrary.trim()) return;
    
    const [name, version] = customLibrary.split('@');
    const library: Library = {
      name: name.trim(),
      version: version || 'latest',
      description: 'Custom library',
    };

    if (!isLibrarySelected(library)) {
      setSelectedLibraries(prev => [...prev, library]);
      setCustomLibrary('');
      toast({
        title: 'Library added',
        description: `${library.name} added to installation list.`,
      });
    }
  };

  const removeLibrary = (libraryName: string) => {
    setSelectedLibraries(prev => prev.filter(lib => lib.name !== libraryName));
  };

  const updateLibraryVersion = (libraryName: string, version: string) => {
    setSelectedLibraries(prev => 
      prev.map(lib => lib.name === libraryName ? { ...lib, version } : lib)
    );
  };

  const toggleDevDependency = (libraryName: string) => {
    setSelectedLibraries(prev => 
      prev.map(lib => lib.name === libraryName ? { ...lib, isDev: !lib.isDev } : lib)
    );
  };

  const generateInstallCommand = () => {
    const prodLibs = selectedLibraries.filter(lib => !lib.isDev);
    const devLibs = selectedLibraries.filter(lib => lib.isDev);
    
    const formatLibs = (libs: Library[]) => 
      libs.map(lib => lib.version && lib.version !== 'latest' ? `${lib.name}@${lib.version}` : lib.name);

    let commands: string[] = [];

    if (prodLibs.length > 0) {
      const libNames = formatLibs(prodLibs).join(' ');
      switch (packageManager) {
        case 'npm':
          commands.push(`npm install ${libNames}`);
          break;
        case 'yarn':
          commands.push(`yarn add ${libNames}`);
          break;
        case 'pnpm':
          commands.push(`pnpm add ${libNames}`);
          break;
        case 'bun':
          commands.push(`bun add ${libNames}`);
          break;
      }
    }

    if (devLibs.length > 0) {
      const libNames = formatLibs(devLibs).join(' ');
      switch (packageManager) {
        case 'npm':
          commands.push(`npm install --save-dev ${libNames}`);
          break;
        case 'yarn':
          commands.push(`yarn add --dev ${libNames}`);
          break;
        case 'pnpm':
          commands.push(`pnpm add --save-dev ${libNames}`);
          break;
        case 'bun':
          commands.push(`bun add --dev ${libNames}`);
          break;
      }
    }

    return commands.join('\n');
  };

  const generatePackageJson = () => {
    const prodDeps: { [key: string]: string } = {};
    const devDeps: { [key: string]: string } = {};

    selectedLibraries.forEach(lib => {
      const version = lib.version || 'latest';
      if (lib.isDev) {
        devDeps[lib.name] = version.startsWith('^') || version.startsWith('~') ? version : `^${version}`;
      } else {
        prodDeps[lib.name] = version.startsWith('^') || version.startsWith('~') ? version : `^${version}`;
      }
    });

    const packageJson = {
      dependencies: Object.keys(prodDeps).length > 0 ? prodDeps : undefined,
      devDependencies: Object.keys(devDeps).length > 0 ? devDeps : undefined,
    };

    return JSON.stringify(packageJson, null, 2);
  };

  const handleInstall = async () => {
    if (selectedLibraries.length === 0) {
      toast({
        title: 'No libraries selected',
        description: 'Please select libraries to install.',
        variant: 'destructive',
      });
      return;
    }

    setIsInstalling(true);
    try {
      if (onInstall) {
        await onInstall(selectedLibraries);
      }
      toast({
        title: 'Libraries installed',
        description: `Successfully installed ${selectedLibraries.length} libraries.`,
      });
    } catch (error) {
      toast({
        title: 'Installation failed',
        description: 'Failed to install libraries. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard',
        description: 'Installation commands copied to clipboard.',
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Library Installer
        </CardTitle>
        <CardDescription>
          Install and manage libraries for your project. Choose from popular libraries or add custom ones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="popular">Popular Libraries</TabsTrigger>
            <TabsTrigger value="selected">Selected ({selectedLibraries.length})</TabsTrigger>
            <TabsTrigger value="commands">Install Commands</TabsTrigger>
          </TabsList>

          <TabsContent value="popular" className="space-y-6">
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="search">Search Libraries</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search libraries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="custom">Add Custom Library</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom"
                    placeholder="library-name@version"
                    value={customLibrary}
                    onChange={(e) => setCustomLibrary(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomLibrary()}
                  />
                  <Button onClick={addCustomLibrary} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLibraries.map((library, index) => (
                  <Card 
                    key={`${library.name}-${index}`} 
                    className={`cursor-pointer transition-colors ${
                      isLibrarySelected(library) ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => toggleLibrary(library)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{library.name}</h4>
                            {library.isDev && (
                              <Badge variant="secondary" className="text-xs">
                                Dev
                              </Badge>
                            )}
                            {isLibrarySelected(library) && (
                              <Badge variant="default" className="text-xs">
                                Selected
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {library.description}
                          </p>
                        </div>
                        <Checkbox
                          checked={isLibrarySelected(library)}
                          onChange={() => toggleLibrary(library)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="selected" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Selected Libraries ({selectedLibraries.length})</h3>
              <Button onClick={handleInstall} disabled={isInstalling || selectedLibraries.length === 0}>
                {isInstalling ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Package className="w-4 h-4 mr-2" />
                )}
                Install Libraries
              </Button>
            </div>

            {selectedLibraries.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No libraries selected</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {selectedLibraries.map((library, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{library.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {library.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={library.version || 'latest'}
                            onChange={(e) => updateLibraryVersion(library.name, e.target.value)}
                            className="w-24"
                            placeholder="Version"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleDevDependency(library.name)}
                          >
                            {library.isDev ? 'Dev' : 'Prod'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLibrary(library.name)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="commands" className="space-y-6">
            <div className="flex gap-2 mb-4">
              <Select value={packageManager} onValueChange={() => {}}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="npm">npm</SelectItem>
                  <SelectItem value="yarn">yarn</SelectItem>
                  <SelectItem value="pnpm">pnpm</SelectItem>
                  <SelectItem value="bun">bun</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(generateInstallCommand())}
                disabled={selectedLibraries.length === 0}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Commands
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Installation Commands</Label>
                <div className="relative">
                  <Terminal className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    value={generateInstallCommand()}
                    readOnly
                    className="font-mono pl-10 min-h-[100px]"
                    placeholder="No libraries selected..."
                  />
                </div>
              </div>

              <div>
                <Label>Package.json Dependencies</Label>
                <Textarea
                  value={generatePackageJson()}
                  readOnly
                  className="font-mono min-h-[200px]"
                  placeholder="No libraries selected..."
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}