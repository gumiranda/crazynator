'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchIcon, StarIcon, EyeIcon, GitForkIcon, HeartIcon, FilterIcon } from 'lucide-react';
import { CommunityProjectCard } from '../components/community-project-card';
import { CommunityProjectFilters } from '../components/community-project-filters';
import { CommunityProjectHeader } from '../components/community-project-header';

// Mock data - this would come from your API
const mockProjects = [
  {
    id: '1',
    name: 'AI Chat Assistant',
    description: 'Um assistente de chat inteligente construído com IA avançada para responder perguntas e ajudar com tarefas.',
    author: 'João Silva',
    authorAvatar: 'https://github.com/joaosilva.png',
    tags: ['AI', 'Chat', 'React'],
    stars: 125,
    views: 1240,
    forks: 23,
    likes: 89,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
    isPublic: true,
    featured: true,
  },
  {
    id: '2',
    name: 'E-commerce Dashboard',
    description: 'Dashboard moderno para gerenciamento de loja online com análises em tempo real.',
    author: 'Maria Santos',
    authorAvatar: 'https://github.com/mariasantos.png',
    tags: ['Dashboard', 'E-commerce', 'Analytics'],
    stars: 87,
    views: 892,
    forks: 15,
    likes: 65,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-18'),
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
    isPublic: true,
    featured: false,
  },
  {
    id: '3',
    name: 'Task Manager App',
    description: 'Aplicativo de gerenciamento de tarefas com interface limpa e funcionalidades avançadas.',
    author: 'Pedro Costa',
    authorAvatar: 'https://github.com/pedrocosta.png',
    tags: ['Productivity', 'React', 'TypeScript'],
    stars: 203,
    views: 1856,
    forks: 45,
    likes: 134,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-22'),
    thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200&fit=crop',
    isPublic: true,
    featured: true,
  },
  {
    id: '4',
    name: 'Weather Widget',
    description: 'Widget elegante para mostrar informações meteorológicas com previsões detalhadas.',
    author: 'Ana Oliveira',
    authorAvatar: 'https://github.com/anaoliveira.png',
    tags: ['Widget', 'Weather', 'API'],
    stars: 56,
    views: 624,
    forks: 12,
    likes: 42,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-16'),
    thumbnail: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400&h=200&fit=crop',
    isPublic: true,
    featured: false,
  },
  {
    id: '5',
    name: 'Crypto Portfolio Tracker',
    description: 'Acompanhe seu portfólio de criptomoedas com gráficos interativos e alertas de preço.',
    author: 'Carlos Lima',
    authorAvatar: 'https://github.com/carloslima.png',
    tags: ['Crypto', 'Finance', 'Charts'],
    stars: 312,
    views: 2145,
    forks: 67,
    likes: 189,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-21'),
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop',
    isPublic: true,
    featured: true,
  },
  {
    id: '6',
    name: 'Recipe Finder',
    description: 'Encontre receitas deliciosas baseadas nos ingredientes que você tem em casa.',
    author: 'Sofia Rodrigues',
    authorAvatar: 'https://github.com/sofiarodrigues.png',
    tags: ['Food', 'Recipe', 'Search'],
    stars: 78,
    views: 967,
    forks: 18,
    likes: 56,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-19'),
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop',
    isPublic: true,
    featured: false,
  },
];

export const CommunityProjectsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'stars'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => project.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.views - a.views;
      case 'stars':
        return b.stars - a.stars;
      case 'recent':
      default:
        return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
  });

  const featuredProjects = sortedProjects.filter(project => project.featured);
  const allProjects = sortedProjects;

  return (
    <div className="min-h-screen bg-background">
      <CommunityProjectHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar projetos da comunidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:w-auto"
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          {showFilters && (
            <CommunityProjectFilters
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          )}
        </div>

        {/* Projects Tabs */}
        <Tabs defaultValue="featured" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="featured">
              <StarIcon className="h-4 w-4 mr-2" />
              Projetos em Destaque
            </TabsTrigger>
            <TabsTrigger value="all">
              Todos os Projetos ({allProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="space-y-6">
            {featuredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  Nenhum projeto em destaque encontrado.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {featuredProjects.map((project) => (
                  <CommunityProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            {allProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  Nenhum projeto encontrado com os filtros aplicados.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {allProjects.map((project) => (
                  <CommunityProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};