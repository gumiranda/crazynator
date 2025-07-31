// app/api/create-checkout-session/route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey || (stripeSecretKey.startsWith('sk_test_') && stripeSecretKey.length < 25)) {
  console.error('⚠️  STRIPE_SECRET_KEY ausente ou inválida');
  throw new Error('Stripe não configurado. Defina STRIPE_SECRET_KEY nas variáveis de ambiente.');
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-07-30.basil' });

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { quantity = 1, priceId } = await request.json();

    if (!priceId) {
      return new NextResponse('Price ID is required', { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: process.env[priceId],
          quantity,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/pricing`,
      client_reference_id: userId,
      customer_email: user.primaryEmailAddress?.emailAddress,
      metadata: {
        clerkUserId: userId,
        userEmail: user.primaryEmailAddress?.emailAddress || '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.log('[STRIPE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
