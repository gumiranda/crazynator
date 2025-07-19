import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Code, Brain, Search, TrendingUp, BookOpen, LineChart, Settings, Lightbulb } from 'lucide-react';
import Link from 'next/link';

const categories = [
  {
    name: 'GitHub Copilot',
    slug: 'github-copilot',
    description: 'Estratégias de marketing e criação de conteúdo usando GitHub Copilot',
    icon: Code,
    articleCount: 15,
    color: 'from-green-500 to-blue-500',
    featured: true,
    topics: ['Setup e Configuração', 'Casos de Uso', 'Integração com Workflow', 'Produtividade']
  },
  {
    name: 'ChatGPT',
    slug: 'chatgpt',
    description: 'Como usar ChatGPT para criar conteúdo técnico de qualidade',
    icon: Brain,
    articleCount: 12,
    color: 'from-purple-500 to-pink-500',
    featured: true,
    topics: ['Prompt Engineering', 'Code Generation', 'Documentação', 'Tutorials']
  },
  {
    name: 'SEO',
    slug: 'seo',
    description: 'Otimização de conteúdo técnico para motores de busca',
    icon: Search,
    articleCount: 8,
    color: 'from-blue-500 to-cyan-500',
    featured: true,
    topics: ['SEO Técnico', 'Palavras-chave', 'Link Building', 'Analytics']
  },
  {
    name: 'Tendências',
    slug: 'tendencias',
    description: 'Últimas tendências em IA e marketing de conteúdo',
    icon: TrendingUp,
    articleCount: 10,
    color: 'from-orange-500 to-red-500',
    featured: false,
    topics: ['Previsões 2024', 'Novas Ferramentas', 'Market Research', 'Inovações']
  },
  {
    name: 'Tutoriais',
    slug: 'tutoriais',
    description: 'Guias práticos e passo a passo para ferramentas de IA',
    icon: BookOpen,
    articleCount: 18,
    color: 'from-emerald-500 to-teal-500',
    featured: false,
    topics: ['Getting Started', 'Advanced Tips', 'Best Practices', 'Troubleshooting']
  },
  {
    name: 'Analytics',
    slug: 'analytics',
    description: 'Métricas e análise de performance para conteúdo técnico',
    icon: LineChart,
    articleCount: 7,
    color: 'from-indigo-500 to-purple-500',
    featured: false,
    topics: ['KPIs', 'ROI', 'Tracking', 'Relatórios']
  },
  {
    name: 'Workflow',
    slug: 'workflow',
    description: 'Processos e metodologias para criação de conteúdo com IA',
    icon: Settings,
    articleCount: 9,
    color: 'from-gray-500 to-slate-500',
    featured: false,
    topics: ['Automation', 'Team Collaboration', 'Tool Integration', 'Efficiency']
  },
  {
    name: 'Comparativos',
    slug: 'comparativos',
    description: 'Análises comparativas de ferramentas e estratégias',
    icon: Lightbulb,
    articleCount: 6,
    color: 'from-yellow-500 to-orange-500',
    featured: false,
    topics: ['Tool Comparison', 'Feature Analysis', 'Pricing', 'Use Cases']
  }
];

const featuredCategories = categories.filter(cat => cat.featured);
const allCategories = categories;

export default function CategoriasPage() {
  const totalArticles = categories.reduce((total, cat) => total + cat.articleCount, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Explore por 
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
            Categorias
          </span>
        </h1>
        <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
          Encontre exatamente o que você precisa. Organizamos nosso conteúdo em categorias 
          específicas para facilitar sua jornada de aprendizado.
        </p>
        <div className="flex justify-center items-center space-x-8 text-sm text-muted-foreground">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
            <div>Categorias</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalArticles}+</div>
            <div>Artigos</div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8">Categorias em Destaque</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card key={category.slug} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className={`h-32 bg-gradient-to-r ${category.color} relative`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/20 text-white border-white/30">
                      {category.articleCount} artigos
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="group-hover:text-blue-600 transition-colors">
                    <Link href={`/categorias/${category.slug}`}>
                      {category.name}
                    </Link>
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {category.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Tópicos Principais:</h4>
                      <div className="flex flex-wrap gap-1">
                        {category.topics.slice(0, 3).map((topic) => (
                          <Badge key={topic} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {category.topics.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{category.topics.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="w-full group-hover:bg-blue-600 transition-colors" 
                      variant="outline"
                      asChild
                    >
                      <Link href={`/categorias/${category.slug}`}>
                        Ver Artigos
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* All Categories */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8">Todas as Categorias</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {allCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Link key={category.slug} href={`/categorias/${category.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${category.color}`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary">
                        {category.articleCount}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-2 hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Popular Topics */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8">Tópicos Populares</h2>
        <div className="flex flex-wrap gap-3">
          {[
            'Prompt Engineering', 'GitHub Copilot Setup', 'SEO para Devs', 'Content Strategy',
            'AI Tools Comparison', 'Code Documentation', 'Technical Writing', 'Developer Marketing',
            'API Documentation', 'Tutorial Creation', 'Code Examples', 'Best Practices'
          ].map((topic) => (
            <Badge key={topic} variant="outline" className="px-4 py-2 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors">
              {topic}
            </Badge>
          ))}
        </div>
      </section>

      {/* Quick Access */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Para Iniciantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Novo no mundo de IA para desenvolvimento? Comece aqui.
            </p>
            <div className="space-y-2">
              <Link href="/categorias/tutoriais" className="block text-sm text-blue-600 hover:underline">
                → Tutoriais Básicos
              </Link>
              <Link href="/categorias/github-copilot" className="block text-sm text-blue-600 hover:underline">
                → Primeiros Passos com Copilot
              </Link>
              <Link href="/categorias/chatgpt" className="block text-sm text-blue-600 hover:underline">
                → ChatGPT para Desenvolvedores
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
              Conteúdo Avançado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Pronto para levar suas skills para o próximo nível?
            </p>
            <div className="space-y-2">
              <Link href="/categorias/workflow" className="block text-sm text-purple-600 hover:underline">
                → Workflow Automation
              </Link>
              <Link href="/categorias/analytics" className="block text-sm text-purple-600 hover:underline">
                → Advanced Analytics
              </Link>
              <Link href="/categorias/comparativos" className="block text-sm text-purple-600 hover:underline">
                → Tool Comparisons
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}