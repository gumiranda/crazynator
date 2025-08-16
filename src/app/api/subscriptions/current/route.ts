// app/api/subscriptions/current/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSubscriptionByClerkId } from '@/lib/services/subscription';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse(
        'Unauthorized',
        { status: 401 },
      );
    }

    const subscription =
      await getSubscriptionByClerkId(
        userId,
      );

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        hasActiveSubscription: false,
      });
    }

    // Check if subscription is active
    const isActive =
      subscription.status === 'active';

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        priceId: subscription.priceId,
        cancelAtPeriodEnd:
          subscription.cancelAtPeriodEnd,
        createdAt:
          subscription.createdAt,
        updatedAt:
          subscription.updatedAt,
        customerId:
          subscription.stripeCustomerId,
      },
      hasActiveSubscription: isActive,
    });
  } catch (error) {
    console.error(
      'Error fetching subscription:',
      error,
    );
    return new NextResponse(
      'Internal error',
      { status: 500 },
    );
  }
}
