import Stripe from 'stripe';
import { stripeService } from './stripe-service';
import { subscriptionService } from './subscription-service';
import { prisma } from './db';
import type { SubscriptionStatus } from '../generated/prisma';

// Extend Stripe types to include missing properties that exist in the actual API
interface StripeSubscriptionWithPeriod extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

interface StripeInvoiceWithSubscription extends Stripe.Invoice {
  subscription: string | Stripe.Subscription;
}

export class WebhookHandler {
  async handleEvent(event: Stripe.Event): Promise<void> {
    console.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as StripeSubscriptionWithPeriod);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as StripeSubscriptionWithPeriod);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as StripeInvoiceWithSubscription);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as StripeInvoiceWithSubscription);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object as StripeSubscriptionWithPeriod);
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
          break;
      }

      console.log(`Successfully processed webhook event: ${event.type}`);
    } catch (error) {
      console.error(`Error processing webhook event ${event.type}:`, error);
      throw error;
    }
  }

  private async handleSubscriptionCreated(subscription: StripeSubscriptionWithPeriod): Promise<void> {
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('No userId found in subscription metadata');
      return;
    }

    const plan = await this.findPlanByPriceId(subscription.items.data[0]?.price?.id);
    
    if (!plan) {
      console.error(`No plan found for price ID: ${subscription.items.data[0]?.price?.id}`);
      return;
    }

    try {
      await subscriptionService.createSubscription({
        userId,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        planId: plan.id,
        status: this.mapStripeStatusToLocal(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });

      console.log(`Created subscription for user ${userId}`);
    } catch (error) {
      if ((error as any).code === 'P2002') {
        console.log('Subscription already exists, updating instead');
        await this.handleSubscriptionUpdated(subscription);
      } else {
        throw error;
      }
    }
  }

  private async handleSubscriptionUpdated(subscription: StripeSubscriptionWithPeriod): Promise<void> {
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('No userId found in subscription metadata');
      return;
    }

    const plan = await this.findPlanByPriceId(subscription.items.data[0]?.price?.id);
    
    if (!plan) {
      console.error(`No plan found for price ID: ${subscription.items.data[0]?.price?.id}`);
      return;
    }

    await subscriptionService.updateSubscriptionByStripeId(subscription.id, {
      status: this.mapStripeStatusToLocal(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      planId: plan.id,
    });

    await this.logBillingEvent(subscription.id, 'subscription.updated', subscription);

    console.log(`Updated subscription for user ${userId}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await subscriptionService.updateSubscriptionByStripeId(subscription.id, {
      status: 'CANCELED',
    });

    await this.logBillingEvent(subscription.id, 'subscription.deleted', subscription);

    console.log(`Canceled subscription ${subscription.id}`);
  }

  private async handlePaymentSucceeded(invoice: StripeInvoiceWithSubscription): Promise<void> {
    if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
      const existingSubscription = await subscriptionService.getSubscriptionByStripeId(
        typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id
      );

      if (existingSubscription) {
        await subscriptionService.resetUsage(existingSubscription.id);
        await subscriptionService.updateSubscriptionByStripeId(
          typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id,
          {
            status: 'ACTIVE',
          }
        );

        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
        await this.logBillingEvent(
          subscriptionId, 
          'payment.succeeded', 
          invoice
        );

        console.log(`Payment succeeded for subscription ${subscriptionId}`);
      }
    }
  }

  private async handlePaymentFailed(invoice: StripeInvoiceWithSubscription): Promise<void> {
    if (invoice.subscription) {
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
      await subscriptionService.updateSubscriptionByStripeId(
        subscriptionId,
        {
          status: 'PAST_DUE',
        }
      );

      await this.logBillingEvent(
        subscriptionId,
        'payment.failed',
        invoice
      );

      console.log(`Payment failed for subscription ${subscriptionId}`);
    }
  }

  private async handleTrialWillEnd(subscription: StripeSubscriptionWithPeriod): Promise<void> {
    await this.logBillingEvent(subscription.id, 'trial.will_end', subscription);

    console.log(`Trial will end for subscription ${subscription.id}`);
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    
    if (!userId) {
      console.error('No userId found in checkout session metadata');
      return;
    }

    if (session.subscription) {
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
      console.log(`Checkout completed for user ${userId}, subscription: ${subscriptionId}`);
    }
  }

  private mapStripeStatusToLocal(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
      'active': 'ACTIVE',
      'canceled': 'CANCELED',
      'incomplete': 'INCOMPLETE',
      'incomplete_expired': 'INCOMPLETE',
      'past_due': 'PAST_DUE',
      'trialing': 'TRIALING',
      'unpaid': 'UNPAID',
      'paused': 'CANCELED', // Treat paused as canceled in our system
    };

    return statusMap[stripeStatus] || 'INCOMPLETE';
  }

  private async findPlanByPriceId(priceId?: string) {
    if (!priceId) return null;

    return await prisma.plan.findUnique({
      where: { stripePriceId: priceId },
    });
  }

  private async logBillingEvent(
    stripeSubscriptionId: string,
    eventType: string,
    data: any
  ): Promise<void> {
    try {
      const subscription = await subscriptionService.getSubscriptionByStripeId(stripeSubscriptionId);
      
      if (subscription) {
        await subscriptionService.logBillingEvent(
          subscription.id,
          eventType,
          `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          data
        );
      }
    } catch (error) {
      console.error('Error logging billing event:', error);
    }
  }

  private isCriticalEvent(eventType: string): boolean {
    const criticalEvents = [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
    ];

    return criticalEvents.includes(eventType);
  }

  async scheduleRetry(event: Stripe.Event): Promise<void> {
    console.log(`Scheduling retry for critical event: ${event.type}`);
  }
}

export const webhookHandler = new WebhookHandler();