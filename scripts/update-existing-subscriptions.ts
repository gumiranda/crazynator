import { subscriptionService } from '../src/lib/subscription-service';

async function updateExistingSubscriptions() {
  try {
    console.log('🔄 Updating existing subscriptions to use new plans...');
    
    const { prisma } = require('../src/lib/db');
    
    // Buscar planos atuais ativos
    const currentPlans = await subscriptionService.getAvailablePlans();
    const freePlan = currentPlans.find(p => p.name === 'Free' && p.price === 0);
    const proPlan = currentPlans.find(p => p.name === 'Pro' && p.price === 3900);
    
    if (!freePlan || !proPlan) {
      console.error('❌ Could not find current active plans');
      return;
    }
    
    console.log(`📋 New Free Plan ID: ${freePlan.id} (${(freePlan.features as any).apiCalls} API calls)`);
    console.log(`📋 New Pro Plan ID: ${proPlan.id} (${(proPlan.features as any).apiCalls} API calls)`);
    
    // Buscar subscriptions ativas que estão usando planos antigos
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        plan: true
      }
    });
    
    console.log(`\n📊 Found ${activeSubscriptions.length} active subscription(s):`);
    
    for (const subscription of activeSubscriptions) {
      const currentFeatures = subscription.plan.features as { apiCalls: number; projects: number; storage: number };
      console.log(`\n👤 User: ${subscription.userId}`);
      console.log(`📋 Current Plan: ${subscription.plan.name} (${currentFeatures.apiCalls} API calls)`);
      
      let newPlanId = null;
      
      // Decidir qual plano novo usar baseado no plano atual
      if (subscription.plan.name === 'Free' && currentFeatures.apiCalls !== 5) {
        newPlanId = freePlan.id;
        console.log(`🔄 Will update to new Free plan (5 API calls)`);
      } else if (subscription.plan.name === 'Pro' && currentFeatures.apiCalls !== 100) {
        newPlanId = proPlan.id;
        console.log(`🔄 Will update to new Pro plan (100 API calls)`);
      } else {
        console.log(`✅ Already using correct plan`);
        continue;
      }
      
      if (newPlanId) {
        await subscriptionService.updateSubscriptionPlan(subscription.id, newPlanId);
        console.log(`✅ Updated subscription to new plan`);
      }
    }
    
    console.log('\n🎉 Subscription updates complete!');
    
  } catch (error) {
    console.error('❌ Error updating subscriptions:', error);
  } finally {
    process.exit(0);
  }
}

updateExistingSubscriptions();