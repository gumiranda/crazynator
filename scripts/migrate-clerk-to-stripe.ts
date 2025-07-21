import { PrismaClient } from '../src/generated/prisma';
import { stripe } from '../src/lib/stripe';
import { createClerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

interface ClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string; }>;
  hasProPlan?: boolean;
}

async function getClerkUsers(): Promise<ClerkUser[]> {
  try {
    console.log('Fetching users from Clerk...');
    
    // Get all users from Clerk
    const users = await clerkClient.users.getUserList({
      limit: 500, // Adjust as needed
    });

    return users.data.map(user => ({
      id: user.id,
      emailAddresses: user.emailAddresses,
      // Check if user has pro plan subscription in Clerk
      hasProPlan: user.publicMetadata?.subscription === 'pro',
    }));
  } catch (error) {
    console.error('Error fetching users from Clerk:', error);
    throw error;
  }
}

async function createStripeCustomer(userId: string, email: string): Promise<string> {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
        source: 'clerk_migration',
      },
    });

    return customer.id;
  } catch (error) {
    console.error(`Error creating Stripe customer for user ${userId}:`, error);
    throw error;
  }
}

async function getDefaultPlan(hasProPlan: boolean) {
  const planName = hasProPlan ? 'Pro' : 'Free';
  
  const plan = await prisma.plan.findFirst({
    where: {
      name: planName,
      active: true,
    },
  });

  if (!plan) {
    throw new Error(`Default plan "${planName}" not found in database`);
  }

  return plan;
}

async function migrateUser(user: ClerkUser) {
  const email = user.emailAddresses[0]?.emailAddress;
  
  if (!email) {
    console.warn(`User ${user.id} has no email address, skipping...`);
    return null;
  }

  try {
    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existingSubscription) {
      console.log(`User ${user.id} already has a subscription, skipping...`);
      return existingSubscription;
    }

    // Create Stripe customer
    const stripeCustomerId = await createStripeCustomer(user.id, email);

    // Get appropriate plan
    const plan = await getDefaultPlan(user.hasProPlan || false);

    // Create subscription in our database
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId,
        stripeSubscriptionId: null, // Will be set when user actually subscribes
        planId: plan.id,
        status: user.hasProPlan ? 'ACTIVE' : 'INCOMPLETE', // Pro users get active status
        currentPeriodStart: user.hasProPlan ? new Date() : null,
        currentPeriodEnd: user.hasProPlan 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          : null,
      },
    });

    console.log(`✅ Migrated user ${user.id} (${email}) to ${plan.name} plan`);
    return subscription;

  } catch (error) {
    console.error(`❌ Failed to migrate user ${user.id}:`, error);
    return null;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Clerk to Stripe migration...');

    // Verify required environment variables
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY environment variable is required');
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    // Check if plans exist
    const plansCount = await prisma.plan.count();
    if (plansCount === 0) {
      throw new Error('No plans found in database. Please run setup-plans.ts first.');
    }

    // Get users from Clerk
    const users = await getClerkUsers();
    console.log(`Found ${users.length} users in Clerk`);

    // Migrate users in batches
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < users.length; i += batchSize) {
      batches.push(users.slice(i, i + batchSize));
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${batches.length}...`);

      const results = await Promise.allSettled(
        batch.map(user => migrateUser(user))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value) {
            migratedCount++;
          } else {
            skippedCount++;
          }
        } else {
          failedCount++;
          console.error(`Failed to migrate user in batch ${batchIndex + 1}, index ${index}:`, result.reason);
        }
      });

      // Small delay between batches to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n✅ Migration complete!');
    console.log(`📊 Summary:`);
    console.log(`  - Successfully migrated: ${migratedCount} users`);
    console.log(`  - Skipped (already exists): ${skippedCount} users`);
    console.log(`  - Failed: ${failedCount} users`);
    console.log(`  - Total processed: ${users.length} users`);

    // Show subscription stats
    const subscriptionStats = await prisma.subscription.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    console.log(`\n📈 Current subscription stats:`);
    subscriptionStats.forEach(stat => {
      console.log(`  - ${stat.status}: ${stat._count.status} users`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}