import { subscriptionService } from '../src/lib/subscription-service';

async function resetUserUsage() {
  try {
    console.log('🔄 Resetting user usage for testing...');
    
    const { prisma } = require('../src/lib/db');
    
    // Buscar usuário que atingiu o limite
    const userWithLimit = await prisma.subscription.findFirst({
      where: { 
        status: 'ACTIVE',
        usageRecords: {
          some: {
            resourceType: 'apiCalls'
          }
        }
      },
      include: {
        plan: true,
        usageRecords: {
          where: {
            resourceType: 'apiCalls',
            timestamp: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Este mês
            },
          },
        },
      },
    });
    
    if (!userWithLimit) {
      console.log('❌ No user with API call usage found');
      return;
    }
    
    console.log(`👤 Found user: ${userWithLimit.userId}`);
    console.log(`📋 Plan: ${userWithLimit.plan.name}`);
    console.log(`🔢 Current API calls used: ${userWithLimit.usageRecords.length}`);
    
    // Resetar usage records de API calls deste mês
    const deletedRecords = await prisma.usageRecord.deleteMany({
      where: {
        subscriptionId: userWithLimit.id,
        resourceType: 'apiCalls',
        timestamp: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });
    
    console.log(`✅ Deleted ${deletedRecords.count} API call usage records`);
    
    // Verificar novo status
    const newUsage = await subscriptionService.getUsageInfo(userWithLimit.userId);
    const apiCallsUsage = newUsage.find(u => u.resourceType === 'apiCalls');
    
    if (apiCallsUsage) {
      console.log(`🎯 New usage: ${apiCallsUsage.used}/${apiCallsUsage.limit} API calls`);
      console.log(`🔢 Remaining: ${apiCallsUsage.limit - apiCallsUsage.used} calls`);
    }
    
    console.log('\n🎉 User usage reset complete! They can now use the app again.');
    
  } catch (error) {
    console.error('❌ Error resetting user usage:', error);
  } finally {
    process.exit(0);
  }
}

resetUserUsage();