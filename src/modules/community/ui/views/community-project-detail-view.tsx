'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  StarIcon, 
  EyeIcon, 
  GitForkIcon, 
  HeartIcon, 
  ShareIcon,
  BookmarkIcon,
  CalendarIcon,
  ExternalLinkIcon,
  DownloadIcon,
  CodeIcon,
  PlayIcon,
  ArrowLeftIcon
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommunityProjectDetailViewProps {
  projectId: string;
}

// Mock data - this would come from your API
const mockProject = {
  id: '1',
  name: 'AI Chat Assistant',
  description: 'Um assistente de chat inteligente construído com IA avançada para responder perguntas e ajudar com tarefas. Este projeto utiliza as mais recentes tecnologias de processamento de linguagem natural para criar uma experiência de chat fluida e intuitiva.',
  longDescription: `
    Este projeto é um assistente de chat completo que demonstra o poder da inteligência artificial aplicada à comunicação humana. 
    
    ## Características Principais
    
    - **Interface moderna e responsiva** construída com React e TypeScript
    - **Integração com APIs de IA** para processamento de linguagem natural
    - **Sistema de autenticação** seguro e fácil de usar
    - **Suporte a múltiplos idiomas** incluindo português e inglês
    - **Chat em tempo real** com websockets
    - **Histórico de conversas** persistente
    
    ## Tecnologias Utilizadas
    
    - React 18 com TypeScript
    - Next.js 14 para SSR e routing
    - Tailwind CSS para estilização
    - Prisma para banco de dados
    - OpenAI API para IA
    - Socket.io para tempo real
    
    ## Como Executar
    
    1. Clone o repositório
    2. Instale as dependências com \`npm install\`
    3. Configure as variáveis de ambiente
    4. Execute \`npm run dev\`
    
    ## Contribuições
    
    Contribuições são muito bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.
  `,
  author: 'João Silva',
  authorAvatar: 'https://github.com/joaosilva.png',
  authorBio: 'Desenvolvedor Full-Stack apaixonado por IA e tecnologias emergentes.',
  tags: ['AI', 'Chat', 'React', 'TypeScript', 'Next.js'],
  stars: 125,
  views: 1240,
  forks: 23,
  likes: 89,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-20'),
  thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
  screenshots: [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=400&fit=crop',
  ],
  isPublic: true,
  featured: true,
  demoUrl: 'https://demo.example.com',
  githubUrl: 'https://github.com/example/ai-chat-assistant',
  projectUrl: '/projects/1',
};

export const CommunityProjectDetailView = ({ projectId }: CommunityProjectDetailViewProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const project = mockProject; // In real app, fetch based on projectId

  const timeAgo = formatDistanceToNow(project.updatedAt, {
    addSuffix: true,
    locale: ptBR,
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project.name,
        text: project.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/community">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Voltar à Comunidade
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
                    <p className="text-lg text-muted-foreground">{project.description}</p>
                  </div>
                  {project.featured && (
                    <Badge className="bg-yellow-500 text-yellow-900 ml-4">
                      <StarIcon className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Author Info */}
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={project.authorAvatar} alt={project.author} />
                    <AvatarFallback>
                      {project.author.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{project.author}</div>
                    <div className="text-sm text-muted-foreground">{project.authorBio}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions & Stats */}
            <div className="space-y-6">
              {/* Stats */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{project.stars}</div>
                      <div className="text-sm text-muted-foreground">Stars</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{project.views}</div>
                      <div className="text-sm text-muted-foreground">Views</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{project.forks}</div>
                      <div className="text-sm text-muted-foreground">Forks</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{project.likes}</div>
                      <div className="text-sm text-muted-foreground">Likes</div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      Atualizado {timeAgo}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                <Link href={project.demoUrl} target="_blank">
                  <Button className="w-full" size="lg">
                    <PlayIcon className="h-5 w-5 mr-2" />
                    Ver Demo
                  </Button>
                </Link>
                
                <Link href={project.projectUrl}>
                  <Button variant="outline" className="w-full">
                    <CodeIcon className="h-4 w-4 mr-2" />
                    Abrir no Editor
                  </Button>
                </Link>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className={`flex-1 ${isLiked ? 'bg-red-50 text-red-600 border-red-200' : ''}`}
                    onClick={handleLike}
                  >
                    <HeartIcon className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                    {isLiked ? 'Curtido' : 'Curtir'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className={`flex-1 ${isBookmarked ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}`}
                    onClick={handleBookmark}
                  >
                    <BookmarkIcon className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                    {isBookmarked ? 'Salvo' : 'Salvar'}
                  </Button>
                  
                  <Button variant="outline" onClick={handleShare}>
                    <ShareIcon className="h-4 w-4" />
                  </Button>
                </div>

                {project.githubUrl && (
                  <Link href={project.githubUrl} target="_blank">
                    <Button variant="outline" className="w-full">
                      <ExternalLinkIcon className="h-4 w-4 mr-2" />
                      Ver no GitHub
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Sobre o Projeto</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ 
                      __html: project.longDescription.replace(/\n/g, '<br>').replace(/## (.*)/g, '<h3>$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code>$1</code>')
                    }} />
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Projeto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Criado em</div>
                      <div>{project.createdAt.toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Última atualização</div>
                      <div>{project.updatedAt.toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Tecnologias</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="screenshots" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.screenshots.map((screenshot, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-video">
                    <img
                      src={screenshot}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes Técnicos</CardTitle>
                <CardDescription>
                  Informações detalhadas sobre a implementação e arquitetura do projeto.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Estrutura do Projeto</h4>
                    <p className="text-muted-foreground">
                      Este projeto segue uma arquitetura modular baseada em componentes React,
                      utilizando TypeScript para garantir type safety e Next.js para otimizações
                      de performance e SEO.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Padrões de Design</h4>
                    <p className="text-muted-foreground">
                      Implementa padrões como Container/Presentational components,
                      custom hooks para lógica reutilizável, e Context API para
                      gerenciamento de estado global.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Performance</h4>
                    <p className="text-muted-foreground">
                      Otimizado com lazy loading, code splitting, e memoização de componentes
                      para garantir uma experiência fluida mesmo com grandes volumes de dados.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};