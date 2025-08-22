'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { plans } from '@/constants/plans';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black-950 to-slate-900">
      <div className="flex flex-col w-full relative px-4 sm:px-6 lg:px-8">
        <section className="space-y-6 pt-8 pb-8 sm:pt-16 sm:pb-16">
          <div className="flex flex-col items-center">
            <Image
              src="/logo.svg"
              alt="CrazyNator"
              width={40}
              height={40}
              className="hidden sm:block mb-4"
            />
          </div>
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
                Escolha seu plano
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-200 px-4">
                Compare os recursos e escolha o plano que melhor atende às suas necessidades.
              </p>
              {currentUsage?.plan && (
                <div className="mt-6 p-4 bg-black/20 backdrop-blur-sm rounded-lg max-w-sm mx-auto border border-white/20">
                  <p className="text-xs text-gray-300 mb-2">Seu plano atual:</p>
                  <div className="flex items-center justify-center gap-2">
                    <Badge
                      variant={
                        currentUsage.plan.type === 'PRO'
                          ? 'default'
                          : currentUsage.plan.type === 'BASIC'
                            ? 'secondary'
                            : 'outline'
                      }
                      className="bg-white/10 text-white border-white/30"
                    >
                      {currentUsage.plan.displayName}
                    </Badge>
                    <span className="text-xs text-gray-300">
                      {currentUsage.remainingPoints} / {currentUsage.plan.credits} créditos
                    </span>
                  </div>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <span className="ml-2 text-white">Carregando planos...</span>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-5xl mx-auto">
                {plans.map((plan) => (
                  <HoverBorderGradient
                    key={plan.name}
                    as="div"
                    containerClassName={`w-full ${
                      plan.popular && !isCurrentPlan(plan.planType)
                        ? 'border-2 border-primary shadow-2xl'
                        : isCurrentPlan(plan.planType)
                          ? 'border-2 border-green-500 shadow-2xl'
                          : 'border border-white/20 hover:border-white/40 transition-all duration-300'
                    }`}
                    className="bg-black/40 backdrop-blur-md border-0 p-0 w-full"
                  >
                    <div className="relative flex flex-col lg:flex-row p-4 sm:p-6 lg:p-8 w-full gap-4 lg:gap-0">
                      {plan.popular && !isCurrentPlan(plan.planType) && (
                        <div className="absolute -top-2 left-4 sm:left-6 lg:left-1/2 lg:transform lg:-translate-x-1/2">
                          <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                            Mais popular
                          </span>
                        </div>
                      )}
                      {isCurrentPlan(plan.planType) && (
                        <div className="absolute -top-2 left-4 sm:left-6 lg:left-1/2 lg:transform lg:-translate-x-1/2 z-10">
                          <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                            <Crown className="h-3 w-3" />
                            Atual
                          </span>
                        </div>
                      )}

                      {/* Seção do plano e preço */}
                      <div className="lg:w-1/3 text-center lg:text-left mb-4 lg:mb-0">
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-white">
                          {plan.name}
                        </h3>
                        <p className="text-gray-300 mb-3 text-sm sm:text-base">
                          {plan.description}
                        </p>
                        <div className="mb-4 lg:mb-0">
                          <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                            {plan.price}
                          </span>
                          {!plan.isFree && (
                            <span className="text-sm sm:text-base text-gray-300 ml-1">/mês</span>
                          )}
                        </div>
                      </div>

                      {/* Seção dos recursos */}
                      <div className="lg:w-1/2 lg:px-6">
                        <ul className="space-y-2 sm:space-y-3">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start">
                              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mr-3 shrink-0 mt-0.5" />
                              <span className="text-sm sm:text-base text-white leading-relaxed">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Seção do botão */}
                      <div className="lg:w-1/6 lg:flex lg:items-center mt-4 lg:mt-0">
                        {plan.isFree ? (
                          <Button
                            disabled={true}
                            variant="outline"
                            size="lg"
                            className="w-full h-12 text-sm sm:text-base bg-white/10 border-white/30 text-white hover:bg-white/20"
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
                            className="w-full h-12 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 text-white shadow-lg cursor-pointer disabled:opacity-50"
                          >
                            {loading === plan.priceId ? 'Processando...' : 'Assinar'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </HoverBorderGradient>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
