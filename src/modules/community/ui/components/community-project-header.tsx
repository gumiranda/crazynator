'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, RocketIcon, UsersIcon, SparklesIcon } from 'lucide-react';
import Link from 'next/link';

export const CommunityProjectHeader = () => {
  return (
    <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Badge variant="outline" className="mb-6 bg-primary/10 text-primary border-primary/20">
            <SparklesIcon className="h-3 w-3 mr-1" />
            Comunidade de Desenvolvedores
          </Badge>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-6">
            Projetos da Comunidade
          </h1>

          {/* Description */}
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Descubra projetos incríveis criados pela nossa comunidade. Inspire-se, 
            aprenda e compartilhe suas próprias criações com desenvolvedores de todo o mundo.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <RocketIcon className="h-4 w-4 text-primary" />
              <span className="font-medium">1,200+ Projetos</span>
            </div>
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-primary" />
              <span className="font-medium">850+ Desenvolvedores</span>
            </div>
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-primary" />
              <span className="font-medium">Novas criações diárias</span>
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/projects/new">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusIcon className="h-5 w-5 mr-2" />
                Compartilhar Projeto
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              <UsersIcon className="h-5 w-5 mr-2" />
              Junte-se à Comunidade
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};