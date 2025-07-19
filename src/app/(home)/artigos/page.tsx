import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Search, Filter } from 'lucide-react';
import Link from 'next/link';

const allArticles = [
  {
    id: 1,
    title: 'Como o GitHub Copilot Está Revolucionando o Marketing de Conteúdo Técnico',
    excerpt: 'Descubra como as IAs geradoras de código estão transformando a forma como criamos conteúdo técnico e documentação. Uma análise profunda das possibilidades.',
    category: 'GitHub Copilot',
    readTime: '8 min',
    date: '2024-01-15',
    author: 'Ana Silva',
    tags: ['GitHub', 'IA', 'Marketing', 'Conteúdo']
  },
  {
    id: 2,
    title: 'Estratégias de SEO para Conteúdo sobre Inteligência Artificial',
    excerpt: 'Aprenda as melhores práticas de SEO para rankear conteúdo sobre IA e ferramentas de desenvolvimento.',
    category: 'SEO',
    readTime: '6 min',
    date: '2024-01-12',
    author: 'Carlos Mendes',
    tags: ['SEO', 'IA', 'Google', 'Ranking']
  },
  {
    id: 3,
    title: 'ChatGPT vs Claude vs Copilot: Comparativo para Criadores de Conteúdo',
    excerpt: 'Uma análise detalhada das principais IAs geradoras de código sob a perspectiva do marketing de conteúdo.',
    category: 'Comparativo',
    readTime: '12 min',
    date: '2024-01-10',
    author: 'Maria Santos',
    tags: ['ChatGPT', 'Claude', 'Copilot', 'Comparativo']
  },
  {
    id: 4,
    title: 'Como Criar Tutoriais Eficazes com IA: Guia Completo',
    excerpt: 'Passo a passo para criar tutoriais técnicos engajantes usando ferramentas de IA.',
    category: 'Tutoriais',
    readTime: '10 min',
    date: '2024-01-08',
    author: 'João Oliveira',
    tags: ['Tutoriais', 'IA', 'Educação', 'Conteúdo']
  },
  {
    id: 5,
    title: 'Métricas Essenciais para Conteúdo sobre Tecnologia',
    excerpt: 'KPIs importantes para medir o sucesso do seu marketing de conteúdo técnico.',
    category: 'Analytics',
    readTime: '7 min',
    date: '2024-01-05',
    author: 'Fernanda Costa',
    tags: ['Analytics', 'KPIs', 'Métricas', 'ROI']
  },
  {
    id: 6,
    title: 'Tendências de IA para 2024: O que Esperar no Marketing',
    excerpt: 'As principais tendências em IA que irão impactar o marketing de conteúdo este ano.',
    category: 'Tendências',
    readTime: '9 min',
    date: '2024-01-03',
    author: 'Ricardo Pereira',
    tags: ['Tendências', 'IA', '2024', 'Futuro']
  },
  {
    id: 7,
    title: 'Como Personalizar Prompts para Melhores Resultados em IA',
    excerpt: 'Técnicas avançadas de prompt engineering para maximizar a qualidade do conteúdo gerado.',
    category: 'Prompts',
    readTime: '11 min',
    date: '2024-01-01',
    author: 'Lucas Rodrigues',
    tags: ['Prompts', 'IA', 'Técnicas', 'Qualidade']
  },
  {
    id: 8,
    title: 'Integrando IA no Processo de Criação de Conteúdo',
    excerpt: 'Como incorporar ferramentas de IA no seu workflow de marketing de conteúdo.',
    category: 'Workflow',
    readTime: '8 min',
    date: '2023-12-28',
    author: 'Patrícia Lima',
    tags: ['Workflow', 'IA', 'Processo', 'Eficiência']
  }
];

const categories = ['Todos', 'GitHub Copilot', 'SEO', 'Comparativo', 'Tutoriais', 'Analytics', 'Tendências', 'Prompts', 'Workflow'];

export default function ArtigosPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Todos os Artigos
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore nossa coleção completa de artigos sobre marketing de conteúdo e IAs geradoras de código.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar artigos..."
            className="pl-10"
          />
        </div>
        <Select defaultValue="todos">
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category.toLowerCase()}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select defaultValue="mais-recentes">
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mais-recentes">Mais Recentes</SelectItem>
            <SelectItem value="mais-antigos">Mais Antigos</SelectItem>
            <SelectItem value="populares">Mais Populares</SelectItem>
            <SelectItem value="tempo-leitura">Tempo de Leitura</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {allArticles.map((article) => (
          <Card key={article.id} className="group hover:shadow-lg transition-shadow h-fit">
            <div className="relative overflow-hidden rounded-t-lg">
              <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500" />
              <Badge className="absolute top-4 left-4">
                {article.category}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="group-hover:text-blue-600 transition-colors line-clamp-2">
                <Link href={`/artigos/${article.id}`}>
                  {article.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 line-clamp-3">
                {article.excerpt}
              </p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {article.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Meta Info */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{article.author}</span>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {article.readTime}
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(article.date).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center space-x-2">
        <Button variant="outline" disabled>
          Anterior
        </Button>
        <Button variant="default">1</Button>
        <Button variant="outline">2</Button>
        <Button variant="outline">3</Button>
        <Button variant="outline">
          Próximo
        </Button>
      </div>

      {/* Newsletter CTA */}
      <section className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-4">Não Perca Nenhum Artigo</h3>
        <p className="text-lg mb-6 opacity-90">
          Assine nossa newsletter e receba os melhores conteúdos diretamente no seu e-mail.
        </p>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/newsletter">
            Assinar Newsletter
          </Link>
        </Button>
      </section>
    </div>
  );
}