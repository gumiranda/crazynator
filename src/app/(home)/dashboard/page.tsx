'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface SubscriptionData {
  subscription: {
    id: string;
    status: string;
    priceId: string;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
    updatedAt: string;
    customerId: string;
  } | null;
  hasActiveSubscription: boolean;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/subscriptions/current');
        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }
        const data = await response.json();
        setSubscriptionData(data);
      } catch (err) {
        setError('Erro ao carregar dados da assinatura');
        console.error('Error fetching subscription:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const getSubscriptionStatus = () => {
    if (!subscriptionData?.subscription)
      return {
        text: 'Sem assinatura',
        variant: 'secondary' as const,
        icon: AlertCircle,
      };

    const { status, cancelAtPeriodEnd } = subscriptionData.subscription;

    if (status === 'active' && !cancelAtPeriodEnd) {
      return {
        text: 'Plano Pro',
        variant: 'default' as const,
        icon: CheckCircle,
      };
    } else if (status === 'active' && cancelAtPeriodEnd) {
      return {
        text: 'Cancelando',
        variant: 'destructive' as const,
        icon: Clock,
      };
    } else if (status === 'past_due') {
      return {
        text: 'Pagamento pendente',
        variant: 'destructive' as const,
        icon: AlertCircle,
      };
    } else {
      return {
        text: 'Inativo',
        variant: 'secondary' as const,
        icon: AlertCircle,
      };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const statusInfo = getSubscriptionStatus();
  const StatusIcon = statusInfo.icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Success Message */}
        {sessionId && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <p className="text-green-800 font-medium">Assinatura ativada com sucesso!</p>
              <p className="text-green-600 text-sm">Bem-vindo ao MinimalSaaS</p>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Bem-vindo de volta!</h2>
          <p className="text-gray-600">Aqui está o resumo da sua conta</p>
          <StatusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        </div>

        {/* Subscription Details */}
        {subscriptionData?.subscription && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Detalhes da Assinatura</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium capitalize">{subscriptionData.subscription.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cancelamento automático</p>
                <p className="font-medium">
                  {subscriptionData.subscription.cancelAtPeriodEnd ? 'Sim' : 'Não'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Criada em</p>
                <p className="font-medium">{formatDate(subscriptionData.subscription.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Última atualização</p>
                <p className="font-medium">{formatDate(subscriptionData.subscription.updatedAt)}</p>
              </div>
              <CustomerPortalButton customerId={subscriptionData?.subscription?.customerId} />
            </div>
          </div>
        )}

        {/* No Subscription Message */}
        {!subscriptionData?.subscription && !loading && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma assinatura ativa</h3>
            <p className="text-gray-600 mb-4">Você não possui uma assinatura ativa no momento.</p>
            <Button asChild>
              <a href="/pricing">Ver Planos</a>
            </Button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
function CustomerPortalButton({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePortalAccess = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePortalAccess}
      disabled={loading}
      variant="outline"
      className="border-gray-600"
    >
      {loading ? 'Carregando...' : '⚙️ Gerenciar Assinatura'}
    </Button>
  );
}
