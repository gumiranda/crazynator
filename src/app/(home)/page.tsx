import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight, Sparkles, Code, Brain } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const featuredArticles = [
  {
    id: 1,
    title: 'Como o GitHub Copilot Está Revolucionando o Marketing de Conteúdo Técnico',
    excerpt: 'Descubra como as IAs geradoras de código estão transformando a forma como criamos conteúdo técnico e documentação.',
    category: 'GitHub Copilot',
    readTime: '8 min',
    date: '2024-01-15',
    featured: true,
    image: '/api/placeholder/600/300'
  },
  {
    id: 2,
    title: 'Estratégias de SEO para Conteúdo sobre Inteligência Artificial',
    excerpt: 'Aprenda as melhores práticas de SEO para rankear conteúdo sobre IA e ferramentas de desenvolvimento.',
    category: 'SEO',
    readTime: '6 min',
    date: '2024-01-12',
    featured: true,
    image: '/api/placeholder/600/300'
  },
  {
    id: 3,
    title: 'ChatGPT vs Claude vs Copilot: Comparativo para Criadores de Conteúdo',
    excerpt: 'Uma análise detalhada das principais IAs geradoras de código sob a perspectiva do marketing de conteúdo.',
    category: 'Comparativo',
    readTime: '12 min',
    date: '2024-01-10',
    featured: true,
    image: '/api/placeholder/600/300'
  }
];

const recentArticles = [
  {
    id: 4,
    title: 'Como Criar Tutoriais Eficazes com IA: Guia Completo',
    excerpt: 'Passo a passo para criar tutoriais técnicos engajantes usando ferramentas de IA.',
    category: 'Tutoriais',
    readTime: '10 min',
    date: '2024-01-08'
  },
  {
    id: 5,
    title: 'Métricas Essenciais para Conteúdo sobre Tecnologia',
    excerpt: 'KPIs importantes para medir o sucesso do seu marketing de conteúdo técnico.',
    category: 'Analytics',
    readTime: '7 min',
    date: '2024-01-05'
  },
  {
    id: 6,
    title: 'Tendências de IA para 2024: O que Esperar no Marketing',
    excerpt: 'As principais tendências em IA que irão impactar o marketing de conteúdo este ano.',
    category: 'Tendências',
    readTime: '9 min',
    date: '2024-01-03'
  }
];

const categories = [
  { name: 'GitHub Copilot', count: 15, icon: Code },
  { name: 'ChatGPT', count: 12, icon: Brain },
  { name: 'SEO', count: 8, icon: Sparkles },
  { name: 'Tutoriais', count: 10, icon: ArrowRight }
];

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl mb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Marketing de Conteúdo para
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              IAs Geradoras de Código
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Estratégias, tendências e insights para criar conteúdo excepcional sobre inteligência artificial e desenvolvimento de software.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/artigos">
                Explorar Artigos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/newsletter">
                Assinar Newsletter
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Artigos em Destaque</h2>
          <Button variant="outline" asChild>
            <Link href="/artigos">Ver Todos</Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {featuredArticles.map((article, index) => (
            <Card key={article.id} className={`group hover:shadow-lg transition-shadow ${index === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}`}>
              <div className="relative overflow-hidden rounded-t-lg">
                <div className={`bg-gradient-to-r from-blue-500 to-purple-500 ${index === 0 ? 'h-64' : 'h-48'}`} />
                <Badge className="absolute top-4 left-4">
                  {article.category}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className={`group-hover:text-blue-600 transition-colors ${index === 0 ? 'text-xl' : 'text-lg'}`}>
                  <Link href={`/artigos/${article.id}`}>
                    {article.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {article.excerpt}
                </p>
                <div className="flex items-center text-sm text-muted-foreground space-x-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(article.date).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {article.readTime}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories and Recent Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Categories */}
        <div className="lg:col-span-1">
          <h3 className="text-2xl font-bold mb-6">Categorias Populares</h3>
          <div className="space-y-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link key={category.name} href={`/categorias/${category.name.toLowerCase()}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{category.name}</h4>
                            <p className="text-sm text-muted-foreground">{category.count} artigos</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Articles */}
        <div className="lg:col-span-2">
          <h3 className="text-2xl font-bold mb-6">Artigos Recentes</h3>
          <div className="space-y-6">
            {recentArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-2">
                        {article.category}
                      </Badge>
                      <h4 className="text-lg font-semibold mb-2 hover:text-blue-600 transition-colors">
                        <Link href={`/artigos/${article.id}`}>
                          {article.title}
                        </Link>
                      </h4>
                      <p className="text-muted-foreground mb-3">{article.excerpt}</p>
                      <div className="flex items-center text-sm text-muted-foreground space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(article.date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {article.readTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter CTA */}
      <section className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h3 className="text-3xl font-bold mb-4">Fique por Dentro das Novidades</h3>
        <p className="text-xl mb-6 opacity-90">
          Receba as últimas tendências em IA e marketing de conteúdo diretamente no seu e-mail.
        </p>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/newsletter">
            Assinar Newsletter Gratuita
          </Link>
        </Button>
      </section>
    </div>
  );
}
