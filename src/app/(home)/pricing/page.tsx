'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';

const plans = [
  {
    name: 'Free',
    price: 'Grátis',
    priceId: null,
    planType: 'FREE',
    description: 'Para testar',
    features: [
      '5 créditos mensais',
      'Acesso básico à plataforma',
      'Gerador de código IA',
      'Suporte da comunidade',
    ],
    credits: 5,
    isFree: true,
  },
  {
    name: 'Básico',
    price: 'R$ 29',
    priceId: 'STRIPE_PRICE_ID_BASIC',
    planType: 'BASIC',
    description: 'Para começar',
    features: [
      '20 créditos mensais',
      'Acesso à plataforma',
      'Suporte por email',
      'Gerador de código IA',
    ],
    credits: 20,
  },
  {
    name: 'Pro',
    price: 'R$ 39,90',
    priceId: 'STRIPE_PRICE_ID_PRO',
    planType: 'PRO',
    description: 'Para crescer',
    features: [
      '50 créditos mensais',
      'Tudo do Básico',
      'Suporte prioritário',
      'Recursos avançados',
    ],
    popular: true,
    credits: 50,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const trpc = useTRPC();

  // Buscar dados do plano atual
  const { data: currentUsage, isLoading: isLoadingUsage } = useQuery(
    trpc.usages.status.queryOptions(),
  );

  const isCurrentPlan = (planType: string) => {
    return currentUsage?.plan?.type === planType;
  };

  const isUpgrade = (planType: string) => {
    const currentPlan = currentUsage?.plan?.type;
    if (currentPlan === 'FREE' && (planType === 'BASIC' || planType === 'PRO')) return true;
    if (currentPlan === 'BASIC' && planType === 'PRO') return true;
    return false;
  };

  const isDowngrade = (planType: string) => {
    const currentPlan = currentUsage?.plan?.type;
    if (currentPlan === 'PRO' && planType === 'BASIC') return true;
    if ((currentPlan === 'PRO' || currentPlan === 'BASIC') && planType === 'FREE') return true;
    return false;
  };

  const handleSubscribe = async (priceId: string, planType: string) => {
    // Verificar se o usuário já tem esse plano
    if (isCurrentPlan(planType)) {
      toast.info('Você já possui este plano ativo!');
      return;
    }

    // Verificar se é um downgrade
    if (isDowngrade(planType)) {
      toast.info('Para alterar para um plano inferior, cancele sua assinatura atual primeiro.');
      return;
    }

    setLoading(priceId);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Erro ao criar sessão:', data.error);
        toast.error('Erro ao processar pagamento. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  const getButtonVariant = (plan: (typeof plans)[0]) => {
    if (isCurrentPlan(plan.planType)) {
      return 'outline';
    }
    if (isDowngrade(plan.planType)) {
      return 'secondary';
    }
    return 'default';
  };

  const isLoading = isLoadingUsage;

  return (
    <div className="flex flex-col max-w-3xl mx-auto w-full">
      <section className="space-y-6 pt-[16vh] 2xl:pt-48">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.svg"
            alt="CrazyNator"
            width={50}
            height={50}
            className="hidden md:block"
          />
        </div>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Escolha seu plano</h1>
            <p className="text-xl text-muted-foreground">
              Compare os recursos e escolha o plano que melhor atende às suas necessidades.
            </p>
            {currentUsage?.plan && (
              <div className="mt-6 p-3 bg-muted/50 rounded-lg max-w-sm mx-auto border">
                <p className="text-xs text-muted-foreground mb-2">Seu plano atual:</p>
                <div className="flex items-center justify-center gap-2">
                  <Badge
                    variant={
                      currentUsage.plan.type === 'PRO'
                        ? 'default'
                        : currentUsage.plan.type === 'BASIC'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {currentUsage.plan.displayName}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {currentUsage.remainingPoints} / {currentUsage.plan.credits} créditos
                  </span>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando planos...</span>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col md:flex-row p-6 md:p-8 ${
                    plan.popular && !isCurrentPlan(plan.planType)
                      ? 'border-2 border-primary shadow-lg'
                      : isCurrentPlan(plan.planType)
                        ? 'border-2 border-green-500 shadow-lg'
                        : 'border shadow-md hover:shadow-lg transition-shadow'
                  }`}
                >
                  {plan.popular && !isCurrentPlan(plan.planType) && (
                    <div className="absolute -top-3 left-4 md:left-1/2 md:transform md:-translate-x-1/2">
                      <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
                        Mais popular
                      </span>
                    </div>
                  )}
                  {isCurrentPlan(plan.planType) && (
                    <div className="absolute -top-3 left-4 md:left-1/2 md:transform md:-translate-x-1/2 z-10">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Atual
                      </span>
                    </div>
                  )}

                  {/* Seção do plano e preço */}
                  <div className="md:w-1/3 text-center md:text-left mb-6 md:mb-0">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground mb-4 text-sm md:text-base">
                      {plan.description}
                    </p>
                    <div className="mb-4 md:mb-0">
                      <span className="text-3xl md:text-4xl font-bold">{plan.price}</span>
                      {!plan.isFree && (
                        <span className="text-sm md:text-base text-muted-foreground ml-1">
                          /mês
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Seção dos recursos */}
                  <div className="md:w-1/2 md:px-8">
                    <ul className="space-y-2 md:space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <Check className="h-4 w-4 md:h-5 md:w-5 text-green-500 mr-3 shrink-0" />
                          <span className="text-sm md:text-base">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Seção do botão */}
                  <div className="md:w-1/6 md:flex md:items-center">
                    {plan.isFree ? (
                      <Button
                        disabled={true}
                        variant="outline"
                        size="lg"
                        className="w-full h-10 md:h-12 text-sm md:text-base"
                      >
                        {isCurrentPlan(plan.planType) ? 'Atual' : 'Gratuito'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          handleSubscribe(plan.priceId!, plan.planType);
                        }}
                        disabled={loading === plan.priceId || isCurrentPlan(plan.planType)}
                        variant={getButtonVariant(plan)}
                        size="lg"
                        className="w-full h-10 md:h-12 text-sm md:text-base cursor-pointer"
                      >
                        {loading === plan.priceId ? 'Processando...' : 'Assinar'}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
