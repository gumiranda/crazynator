'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  StarIcon, 
  EyeIcon, 
  GitForkIcon, 
  HeartIcon, 
  PlayIcon, 
  ShareIcon,
  BookmarkIcon,
  CalendarIcon 
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommunityProject {
  id: string;
  name: string;
  description: string;
  author: string;
  authorAvatar: string;
  tags: string[];
  stars: number;
  views: number;
  forks: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  thumbnail: string;
  isPublic: boolean;
  featured: boolean;
}

interface CommunityProjectCardProps {
  project: CommunityProject;
}

export const CommunityProjectCard = ({ project }: CommunityProjectCardProps) => {
  const timeAgo = formatDistanceToNow(project.updatedAt, {
    addSuffix: true,
    locale: ptBR,
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project.name,
        text: project.description,
        url: `/community/projects/${project.id}`,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/community/projects/${project.id}`);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={project.thumbnail}
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {project.featured && (
          <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-900">
            <StarIcon className="h-3 w-3 mr-1" />
            Destaque
          </Badge>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button size="sm" className="bg-white/90 text-black hover:bg-white">
            <PlayIcon className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {project.description}
            </CardDescription>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {project.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {project.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{project.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="py-3">
        {/* Author Info */}
        <div className="flex items-center space-x-2 mb-4">
          <Avatar className="h-6 w-6">
            <AvatarImage src={project.authorAvatar} alt={project.author} />
            <AvatarFallback className="text-xs">
              {project.author.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground font-medium">{project.author}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <StarIcon className="h-4 w-4" />
              <span>{project.stars}</span>
            </div>
            <div className="flex items-center space-x-1">
              <EyeIcon className="h-4 w-4" />
              <span>{project.views}</span>
            </div>
            <div className="flex items-center space-x-1">
              <GitForkIcon className="h-4 w-4" />
              <span>{project.forks}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <CalendarIcon className="h-3 w-3" />
            <span className="text-xs">{timeAgo}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <HeartIcon className="h-4 w-4 mr-1" />
            {project.likes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={handleShare}
          >
            <ShareIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <BookmarkIcon className="h-4 w-4" />
          </Button>
        </div>
        <Link href={`/community/projects/${project.id}`}>
          <Button size="sm">
            Ver Projeto
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};