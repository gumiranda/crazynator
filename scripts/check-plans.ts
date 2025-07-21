import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function checkPlans() {
  try {
    console.log('Checking plans in database...');
    
    const plans = await prisma.plan.findMany({
      orderBy: {
        price: 'asc'
      }
    });

    if (plans.length === 0) {
      console.log('❌ No plans found in database');
      return;
    }

    console.log(`✅ Found ${plans.length} plans in database:`);
    
    plans.forEach(plan => {
      console.log(`\n📋 Plan: ${plan.name}`);
      console.log(`   Price: $${(plan.price / 100).toFixed(2)}/${plan.interval}`);
      console.log(`   Stripe Price ID: ${plan.stripePriceId}`);
      console.log(`   Features:`, plan.features);
      console.log(`   Active: ${plan.active}`);
      console.log(`   Created: ${plan.createdAt.toISOString()}`);
    });

  } catch (error) {
    console.error('❌ Error checking plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();