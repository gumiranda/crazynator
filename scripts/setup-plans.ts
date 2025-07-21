import { planSeeder } from '../src/lib/plan-seeder';

async function main() {
  try {
    console.log('🚀 Setting up Stripe billing plans...');

    // Usar o PlanSeeder para criar os planos padrão
    const plans = await planSeeder.seedDefaultPlans({ skipIfExists: true });

    if (plans.length > 0) {
      console.log('✅ Setup complete! Created the following plans:');
      plans.forEach(plan => {
        console.log(`- ${plan.name}: $${(plan.price / 100).toFixed(2)}/${plan.interval}`);
        console.log(`  Features:`, plan.features);
      });
    } else {
      console.log('⚠️ No new plans were created (they may already exist)');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await planSeeder.disconnect();
  }
}

if (require.main === module) {
  main();
}