// app/api/create-portal-session/route.ts
import {
  NextRequest,
  NextResponse,
} from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!,
  {
    apiVersion: '2025-07-30.basil',
  },
);

export async function POST(
  request: NextRequest,
) {
  try {
    const { customerId } =
      await request.json();

    if (!customerId) {
      return NextResponse.json(
        {
          error:
            'Customer ID é obrigatório',
        },
        { status: 400 },
      );
    }

    // Criar sessão do portal do cliente
    const portalSession =
      await stripe.billingPortal.sessions.create(
        {
          customer: customerId,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        },
      );

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error(
      'Erro ao criar portal session:',
      error,
    );
    return NextResponse.json(
      {
        error:
          'Erro interno do servidor',
      },
      { status: 500 },
    );
  }
}
