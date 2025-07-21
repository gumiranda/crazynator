import { planSeeder } from '../src/lib/plan-seeder';

async function main() {
  try {
    console.log('🔄 Resetting all plans...');

    // Desativar planos existentes
    console.log('🔒 Deactivating existing plans...');
    const existingPlans = await planSeeder.getActivePlans();
    
    for (const plan of existingPlans) {
      await planSeeder.deactivatePlan(plan.name);
    }

    if (existingPlans.length > 0) {
      console.log(`✅ Deactivated ${existingPlans.length} existing plans`);
    }

    // Criar novos planos
    console.log('🆕 Creating new plans...');
    const plans = await planSeeder.seedDefaultPlans({ skipIfExists: false });

    console.log('✅ Reset complete! Created the following plans:');
    plans.forEach(plan => {
      console.log(`- ${plan.name}: $${(plan.price / 100).toFixed(2)}/${plan.interval}`);
      console.log(`  Features:`, plan.features);
    });

  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  } finally {
    await planSeeder.disconnect();
  }
}

if (require.main === module) {
  main();
}