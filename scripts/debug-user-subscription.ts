import { subscriptionService } from '../src/lib/subscription-service';

async function debugUserSubscription() {
  try {
    console.log('🔍 Debugging user subscriptions...');
    
    // Simular um userId - você pode substituir por um ID real do seu teste
    // Vou primeiro listar todas as subscriptions
    const { prisma } = require('../src/lib/db');
    
    const allSubscriptions = await prisma.subscription.findMany({
      include: {
        plan: true,
        usageRecords: {
          where: {
            timestamp: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Este mês
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (allSubscriptions.length === 0) {
      console.log('❌ No subscriptions found in database');
      console.log('💡 You might need to activate a plan first through the UI');
      return;
    }

    console.log(`\n📊 Found ${allSubscriptions.length} subscription(s):`);
    
    for (const sub of allSubscriptions) {
      console.log(`\n👤 User ID: ${sub.userId}`);
      console.log(`📋 Plan: ${sub.plan.name} ($${(sub.plan.price / 100).toFixed(2)}/${sub.plan.interval})`);
      console.log(`📈 Status: ${sub.status}`);
      console.log(`🔢 Usage Records This Month: ${sub.usageRecords.length}`);
      
      const features = sub.plan.features as { projects: number; apiCalls: number; storage: number };
      console.log(`🎯 Limits: ${features.apiCalls} API calls, ${features.projects} projects, ${features.storage}MB storage`);
      
      if (sub.usageRecords.length > 0) {
        console.log(`📝 Recent usage:`);
        sub.usageRecords.slice(0, 3).forEach((record: any) => {
          console.log(`   - ${record.resourceType}: ${record.amount} (${record.timestamp.toISOString()})`);
        });
      }
    }

    // Testar o método getUserSubscription com o primeiro usuário
    if (allSubscriptions.length > 0) {
      const testUserId = allSubscriptions[0].userId;
      console.log(`\n🧪 Testing getUserSubscription for user: ${testUserId}`);
      
      const userSub = await subscriptionService.getUserSubscription(testUserId);
      if (userSub) {
        console.log(`✅ Found subscription: ${userSub.plan.name} (${userSub.status})`);
        
        // Testar checkUsageLimit
        const canUseApiCalls = await subscriptionService.checkUsageLimit(testUserId, 'apiCalls');
        console.log(`🔍 Can use API calls: ${canUseApiCalls}`);
        
        const usageInfo = await subscriptionService.getUsageInfo(testUserId);
        console.log(`📊 Usage info:`, usageInfo);
      } else {
        console.log(`❌ getUserSubscription returned null`);
      }
    }

  } catch (error) {
    console.error('❌ Error debugging subscription:', error);
  } finally {
    process.exit(0);
  }
}

debugUserSubscription();