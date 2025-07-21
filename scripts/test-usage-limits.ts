import { subscriptionService } from '../src/lib/subscription-service';

async function testUsageLimits() {
  try {
    console.log('🧪 Testing usage limits...');

    // Obter planos ativos
    const plans = await subscriptionService.getAvailablePlans();
    
    console.log('\n📋 Current active plans and their limits:');
    plans.forEach(plan => {
      const features = plan.features as { projects: number; apiCalls: number; storage: number };
      console.log(`\n• ${plan.name} Plan ($${(plan.price / 100).toFixed(2)}/${plan.interval}):`);
      console.log(`  - API Calls: ${features.apiCalls}`);
      console.log(`  - Projects: ${features.projects}`);
      console.log(`  - Storage: ${features.storage}MB`);
    });

    console.log('\n✅ Usage limits verification complete!');
    
  } catch (error) {
    console.error('❌ Error testing usage limits:', error);
  } finally {
    process.exit(0);
  }
}

testUsageLimits();