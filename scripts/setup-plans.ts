import { PrismaClient } from '../src/generated/prisma';
import { stripe } from '../src/lib/stripe';

const prisma = new PrismaClient();

async function createPlansInStripe() {
  try {
    console.log('Creating products and prices in Stripe...');

    // Free Plan
    const freeProduct = await stripe.products.create({
      name: 'Free',
      description: 'Get started with basic features',
      metadata: {
        projects: '3',
        apiCalls: '50',
        storage: '100',
      },
    });

    const freePrice = await stripe.prices.create({
      product: freeProduct.id,
      unit_amount: 0,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });

    // Pro Plan
    const proProduct = await stripe.products.create({
      name: 'Pro',
      description: 'Perfect for professionals and small teams',
      metadata: {
        projects: '25',
        apiCalls: '1000',
        storage: '1000',
      },
    });

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 1900, // $19.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });

    // Team Plan
    const teamProduct = await stripe.products.create({
      name: 'Team',
      description: 'For growing teams and organizations',
      metadata: {
        projects: '100',
        apiCalls: '5000',
        storage: '5000',
      },
    });

    const teamPrice = await stripe.prices.create({
      product: teamProduct.id,
      unit_amount: 4900, // $49.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });

    console.log('✅ Created products and prices in Stripe');

    return [
      { product: freeProduct, price: freePrice },
      { product: proProduct, price: proPrice },
      { product: teamProduct, price: teamPrice },
    ];
  } catch (error) {
    console.error('Error creating products in Stripe:', error);
    throw error;
  }
}

async function createPlansInDatabase(stripeData: any[]) {
  try {
    console.log('Creating plans in database...');

    const plans = await Promise.all(
      stripeData.map(({ product, price }) => {
        const features = {
          projects: parseInt(product.metadata.projects),
          apiCalls: parseInt(product.metadata.apiCalls),
          storage: parseInt(product.metadata.storage),
        };

        return prisma.plan.create({
          data: {
            name: product.name,
            stripePriceId: price.id,
            stripeProductId: product.id,
            price: price.unit_amount,
            currency: price.currency,
            interval: price.recurring!.interval,
            features,
            active: true,
          },
        });
      })
    );

    console.log('✅ Created plans in database');
    console.log(`Created ${plans.length} plans:`, plans.map(p => p.name));

    return plans;
  } catch (error) {
    console.error('Error creating plans in database:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Setting up Stripe billing plans...');

    // Check if plans already exist
    const existingPlans = await prisma.plan.findMany();
    if (existingPlans.length > 0) {
      console.log('⚠️ Plans already exist in database. Skipping setup.');
      console.log('Existing plans:', existingPlans.map(p => p.name));
      return;
    }

    const stripeData = await createPlansInStripe();
    const plans = await createPlansInDatabase(stripeData);

    console.log('✅ Setup complete! Created the following plans:');
    plans.forEach(plan => {
      console.log(`- ${plan.name}: $${(plan.price / 100).toFixed(2)}/${plan.interval}`);
      console.log(`  Features:`, plan.features);
    });

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}