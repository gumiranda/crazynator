import { usageMiddleware } from '../src/lib/usage-middleware';
import { subscriptionService } from '../src/lib/subscription-service';

async function testUsageBlocking() {
  try {
    console.log('🧪 Testing usage blocking mechanism...');
    
    const { prisma } = require('../src/lib/db');
    
    // Buscar usuário com subscription ativa
    const subscription = await prisma.subscription.findFirst({
      where: { status: 'ACTIVE' },
      include: { plan: true }
    });
    
    if (!subscription) {
      console.log('❌ No active subscription found for testing');
      return;
    }
    
    const userId = subscription.userId;
    const features = subscription.plan.features as { apiCalls: number; projects: number; storage: number };
    
    console.log(`\n👤 Testing user: ${userId}`);
    console.log(`📋 Plan: ${subscription.plan.name} (${features.apiCalls} API calls limit)`);
    
    // 1. Verificar status atual
    console.log('\n1️⃣ Checking current usage...');
    const usageInfo = await subscriptionService.getUsageInfo(userId);
    const apiCallsUsage = usageInfo.find(u => u.resourceType === 'apiCalls');
    
    if (apiCallsUsage) {
      console.log(`   Current usage: ${apiCallsUsage.used}/${apiCallsUsage.limit} (${apiCallsUsage.percentage.toFixed(1)}%)`);
    }
    
    // 2. Testar preflight check
    console.log('\n2️⃣ Testing preflight check...');
    const canUse = await usageMiddleware.preflightCheck(userId, 'apiCalls');
    console.log(`   Can use API calls: ${canUse}`);
    
    // 3. Testar checkUsageLimit diretamente
    console.log('\n3️⃣ Testing checkUsageLimit directly...');
    const canUseDirectly = await subscriptionService.checkUsageLimit(userId, 'apiCalls');
    console.log(`   checkUsageLimit result: ${canUseDirectly}`);
    
    // 4. Simular consumo até o limite
    const currentUsed = apiCallsUsage?.used || 0;
    const limit = apiCallsUsage?.limit || features.apiCalls;
    const remaining = limit - currentUsed;
    
    console.log(`\n4️⃣ Attempting to consume remaining ${remaining} API calls...`);
    
    if (remaining > 0) {
      try {
        // Tentar consumir uma chamada
        console.log(`   Trying to consume 1 API call...`);
        await usageMiddleware.checkAndRecordUsage(userId, 'apiCalls', 1, {
          test: true,
          timestamp: new Date().toISOString()
        });
        console.log(`   ✅ Successfully consumed 1 API call`);
        
        // Verificar novo status
        const newUsageInfo = await subscriptionService.getUsageInfo(userId);
        const newApiCallsUsage = newUsageInfo.find(u => u.resourceType === 'apiCalls');
        console.log(`   New usage: ${newApiCallsUsage?.used}/${newApiCallsUsage?.limit}`);
        
        // Se ainda há espaço, consumir até o limite
        if (newApiCallsUsage && newApiCallsUsage.used < newApiCallsUsage.limit) {
          const stillRemaining = newApiCallsUsage.limit - newApiCallsUsage.used;
          console.log(`\n5️⃣ Consuming remaining ${stillRemaining} calls to hit limit...`);
          
          for (let i = 0; i < stillRemaining; i++) {
            await usageMiddleware.checkAndRecordUsage(userId, 'apiCalls', 1, {
              test: true,
              iteration: i + 1
            });
            console.log(`   Consumed call ${i + 1}/${stillRemaining}`);
          }
          
          console.log('\n6️⃣ Testing if next call is blocked...');
          try {
            await usageMiddleware.checkAndRecordUsage(userId, 'apiCalls', 1);
            console.log(`   ❌ ERROR: Call was allowed when it should be blocked!`);
          } catch (error: any) {
            if (error.code === 'USAGE_LIMIT_EXCEEDED') {
              console.log(`   ✅ SUCCESS: Call was properly blocked!`);
              console.log(`   Error: ${error.message}`);
            } else {
              console.log(`   ❓ Unexpected error: ${error.message}`);
            }
          }
        }
        
      } catch (error: any) {
        if (error.code === 'USAGE_LIMIT_EXCEEDED') {
          console.log(`   ✅ Usage limit properly enforced!`);
          console.log(`   Error: ${error.message}`);
          console.log(`   Current: ${error.current}, Limit: ${error.limit}`);
        } else {
          console.log(`   ❌ Unexpected error: ${error.message}`);
        }
      }
    } else {
      console.log(`   User has already reached the limit, testing blocking...`);
      try {
        await usageMiddleware.checkAndRecordUsage(userId, 'apiCalls', 1);
        console.log(`   ❌ ERROR: Call was allowed when user is at limit!`);
      } catch (error: any) {
        console.log(`   ✅ SUCCESS: Call properly blocked at limit!`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing usage blocking:', error);
  } finally {
    process.exit(0);
  }
}

testUsageBlocking();