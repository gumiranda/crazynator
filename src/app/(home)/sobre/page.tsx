import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Target, Users, Lightbulb, Rocket, Mail, Linkedin, Github } from 'lucide-react';
import Link from 'next/link';

const team = [
  {
    name: 'Ana Silva',
    role: 'CEO & Fundadora',
    bio: 'Especialista em marketing de conteúdo com 8+ anos de experiência. Apaixonada por IA e inovação.',
    expertise: ['Marketing de Conteúdo', 'IA', 'SEO', 'Estratégia Digital'],
    social: {
      linkedin: '#',
      github: '#',
      email: 'ana@codeaiblog.com'
    }
  },
  {
    name: 'Carlos Mendes',
    role: 'Editor Técnico',
    bio: 'Desenvolvedor full-stack e especialista em ferramentas de IA. Responsável pela precisão técnica do conteúdo.',
    expertise: ['GitHub Copilot', 'ChatGPT', 'Desenvolvimento', 'Code Review'],
    social: {
      linkedin: '#',
      github: '#',
      email: 'carlos@codeaiblog.com'
    }
  },
  {
    name: 'Maria Santos',
    role: 'Especialista em SEO',
    bio: 'Estrategista de SEO com foco em conteúdo técnico. Garante que nossos artigos alcancem a audiência certa.',
    expertise: ['SEO Técnico', 'Analytics', 'Pesquisa de Palavras-chave', 'Link Building'],
    social: {
      linkedin: '#',
      github: '#',
      email: 'maria@codeaiblog.com'
    }
  }
];

const values = [
  {
    icon: Target,
    title: 'Precisão Técnica',
    description: 'Todo conteúdo é revisado por especialistas para garantir precisão e relevância.'
  },
  {
    icon: Users,
    title: 'Comunidade',
    description: 'Construímos uma comunidade de profissionais interessados em IA e marketing.'
  },
  {
    icon: Lightbulb,
    title: 'Inovação',
    description: 'Sempre exploramos as últimas tendências e ferramentas do mercado.'
  },
  {
    icon: Rocket,
    title: 'Crescimento',
    description: 'Ajudamos profissionais e empresas a crescerem com estratégias eficazes.'
  }
];

const stats = [
  { label: 'Artigos Publicados', value: '150+' },
  { label: 'Leitores Mensais', value: '25K+' },
  { label: 'Newsletter Subscribers', value: '5K+' },
  { label: 'Ferramentas Analisadas', value: '50+' }
];

export default function SobrePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16 mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Sobre o 
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
            CodeAI Blog
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Somos especialistas em marketing de conteúdo para o universo das IAs geradoras de código, 
          ajudando profissionais e empresas a se destacarem neste mercado em rápida evolução.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center">
                <Target className="h-6 w-6 mr-3 text-blue-600" />
                Nossa Missão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Democratizar o conhecimento sobre marketing de conteúdo no universo das IAs geradoras de código, 
                fornecendo insights práticos, estratégias comprovadas e análises aprofundadas para profissionais 
                que querem se destacar neste mercado.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center">
                <Lightbulb className="h-6 w-6 mr-3 text-purple-600" />
                Nossa Visão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Ser a principal referência em conteúdo educativo sobre marketing e IAs geradoras de código, 
                criando uma comunidade ativa de profissionais que compartilham conhecimento e impulsionam 
                a inovação no setor.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator className="mb-16" />

      {/* Values */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Nossos Valores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => {
            const IconComponent = value.icon;
            return (
              <Card key={index} className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="mb-4 flex justify-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Team */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-4">Nossa Equipe</h2>
        <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Conheça os especialistas por trás do CodeAI Blog, cada um trazendo expertise única 
          para criar o melhor conteúdo sobre IA e marketing.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500" />
              <CardHeader>
                <CardTitle className="text-xl">{member.name}</CardTitle>
                <p className="text-blue-600 font-medium">{member.role}</p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{member.bio}</p>
                
                {/* Expertise Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {member.expertise.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>

                {/* Social Links */}
                <div className="flex space-x-3">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={member.social.linkedin}>
                      <Linkedin className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={member.social.github}>
                      <Github className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`mailto:${member.social.email}`}>
                      <Mail className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* What We Cover */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">O Que Cobrimos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Ferramentas de IA</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• GitHub Copilot</li>
                <li>• ChatGPT para desenvolvimento</li>
                <li>• Claude AI</li>
                <li>• Tabnine</li>
                <li>• Replit Ghostwriter</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Estratégias de Marketing</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Content Marketing</li>
                <li>• SEO Técnico</li>
                <li>• Social Media</li>
                <li>• Email Marketing</li>
                <li>• Thought Leadership</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tendências & Análises</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Comparativos de ferramentas</li>
                <li>• Estudos de caso</li>
                <li>• Previsões do mercado</li>
                <li>• Métricas e ROI</li>
                <li>• Best practices</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h3 className="text-3xl font-bold mb-4">Trabalhe Conosco</h3>
        <p className="text-xl mb-6 opacity-90">
          Interessado em contribuir com artigos ou tem uma proposta de parceria? 
          Adoraríamos conversar com você!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" asChild>
            <Link href="/contato">
              Entre em Contato
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
            <Link href="/newsletter">
              Assinar Newsletter
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}