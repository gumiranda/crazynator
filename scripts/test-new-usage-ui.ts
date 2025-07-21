import { getUsageStatusWithStripe } from '../src/lib/usage-integration';

async function testNewUsageUI() {
  try {
    console.log('🧪 Testing new usage UI integration...');
    
    // Simular auth context (normalmente viria do Clerk)
    const { auth } = require('@clerk/nextjs/server');
    console.log('📋 Getting usage status...');
    
    const result = await getUsageStatusWithStripe();
    
    if (!result) {
      console.log('❌ No usage status returned (user might not have active subscription)');
      return;
    }
    
    console.log('\n✅ Usage status retrieved successfully:');
    console.log(`🔢 Remaining Points: ${result.remainingPoints}`);
    console.log(`⏰ MS Before Next Reset: ${result.msBeforeNext}`);
    console.log(`📊 Has Active Subscription: ${result.hasActiveSubscription}`);
    
    if (result.subscription) {
      console.log(`📋 Plan: ${result.subscription.plan.name} ($${(result.subscription.plan.price / 100).toFixed(2)}/${result.subscription.plan.interval})`);
    }
    
    if (result.usage && result.usage.length > 0) {
      console.log('\n📊 Detailed Usage:');
      result.usage.forEach(usage => {
        console.log(`   ${usage.resourceType}: ${usage.used}/${usage.limit} (${usage.percentage.toFixed(1)}%)`);
      });
    }
    
    // Calcular tempo até reset em formato legível
    const resetDate = new Date(Date.now() + result.msBeforeNext);
    console.log(`🔄 Next Reset: ${resetDate.toLocaleDateString()} at ${resetDate.toLocaleTimeString()}`);
    
  } catch (error) {
    console.error('❌ Error testing new usage UI:', error);
  } finally {
    process.exit(0);
  }
}

testNewUsageUI();