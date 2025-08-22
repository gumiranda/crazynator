import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { debugStripeSubscriptions } from '@/lib/services/subscription';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripeSubscriptions = await debugStripeSubscriptions(userId);

    return NextResponse.json({
      success: true,
      userId,
      stripeSubscriptions: stripeSubscriptions.map((sub) => ({
        id: sub.id,
        status: sub.status,
        priceId: sub.items.data[0]?.price.id,
        created: new Date(sub.created * 1000),
        current_period_start: new Date(sub.current_period_start * 1000),
        current_period_end: new Date(sub.current_period_end * 1000),
        cancel_at_period_end: sub.cancel_at_period_end,
      })),
    });
  } catch (error) {
    console.error('❌ [debug-subscriptions] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
