import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Code2, 
  Zap, 
  Layers, 
  Database, 
  Palette, 
  Terminal,
  ArrowRight,
  Sparkles 
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Sistema de Geração Automatizada
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Crazy Code Project
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Seu projeto foi criado com um sistema completo de geração automatizada de código 
            que otimiza o uso de IA e acelera o desenvolvimento em 10x.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="group">
              <Terminal className="h-4 w-4 mr-2" />
              npm run generate
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg">
              Ver Documentação
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <Code2 className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Componentes React</CardTitle>
              <CardDescription>
                Gere componentes React com TypeScript, testes e stories automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-gray-100 p-2 rounded block">
                npm run gen:component
              </code>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <Database className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>tRPC Routers</CardTitle>
              <CardDescription>
                Crie routers tRPC completos com CRUD, validação e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-gray-100 p-2 rounded block">
                npm run gen:trpc
              </code>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <Layers className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Módulos Completos</CardTitle>
              <CardDescription>
                Gere módulos inteiros com server + UI + estado em minutos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-gray-100 p-2 rounded block">
                npm run gen:module
              </code>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <Palette className="h-8 w-8 text-pink-600 mb-2" />
              <CardTitle>Páginas Next.js</CardTitle>
              <CardDescription>
                Crie páginas estáticas, dinâmicas e API routes automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-gray-100 p-2 rounded block">
                npm run gen:page
              </code>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-600 mb-2" />
              <CardTitle>Hooks & Stores</CardTitle>
              <CardDescription>
                Gere hooks customizados e stores Zustand com features avançadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-gray-100 p-2 rounded block">
                npm run gen:hook
              </code>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <Sparkles className="h-8 w-8 text-indigo-600 mb-2" />
              <CardTitle>Templates IA</CardTitle>
              <CardDescription>
                Templates otimizados para IA com CRUD completo e funcionalidades avançadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-gray-100 p-2 rounded block">
                npm run gen:ai
              </code>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">🚀 Quick Start</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">1. Gere um módulo completo</h3>
                <code className="bg-white/20 p-2 rounded block text-sm mb-2">
                  npm run gen:module
                </code>
                <p className="text-sm opacity-90">
                  Cria estrutura completa com server, UI, tipos e estado
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">2. Use IA para estender</h3>
                <p className="text-sm opacity-90 mb-2">
                  "Baseado no código gerado, adicione funcionalidade X mantendo os padrões"
                </p>
                <p className="text-sm opacity-90">
                  A IA entende perfeitamente a estrutura gerada
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="text-center mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-gray-900">95%</div>
              <div className="text-sm text-gray-600">Redução de tempo</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">35+</div>
              <div className="text-sm text-gray-600">Templates disponíveis</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">7</div>
              <div className="text-sm text-gray-600">Geradores diferentes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">10x</div>
              <div className="text-sm text-gray-600">Mais produtivo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}