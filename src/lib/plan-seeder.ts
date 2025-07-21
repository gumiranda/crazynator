import { PrismaClient } from '../generated/prisma';
import { stripe } from './stripe';

export interface PlanConfig {
  name: string;
  description: string;
  price: number; // em centavos
  interval: 'month' | 'year';
  features: {
    projects: number;
    apiCalls: number;
    storage: number; // em MB
  };
}

export const DEFAULT_PLANS: PlanConfig[] = [
  {
    name: 'Free',
    description: 'Get started with basic features',
    price: 0,
    interval: 'month',
    features: {
      projects: 3,
      apiCalls: 5, // Limite correto: 5 chamadas
      storage: 100,
    },
  },
  {
    name: 'Pro',
    description: 'Perfect for professionals and small teams',
    price: 3900, // $39.00
    interval: 'month',
    features: {
      projects: 25,
      apiCalls: 100, // Limite correto: 100 chamadas
      storage: 1000,
    },
  },
];

export class PlanSeeder {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Valida os dados de um plano
   */
  private validatePlanConfig(config: PlanConfig): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new Error('Plan name is required');
    }

    if (!config.description || config.description.trim().length === 0) {
      throw new Error('Plan description is required');
    }

    if (config.price < 0) {
      throw new Error('Plan price must be non-negative');
    }

    if (!['month', 'year'].includes(config.interval)) {
      throw new Error('Plan interval must be "month" or "year"');
    }

    const { features } = config;
    if (!features || typeof features !== 'object') {
      throw new Error('Plan features are required');
    }

    if (!Number.isInteger(features.projects) || features.projects <= 0) {
      throw new Error('Projects limit must be a positive integer');
    }

    if (!Number.isInteger(features.apiCalls) || features.apiCalls <= 0) {
      throw new Error('API calls limit must be a positive integer');
    }

    if (!Number.isInteger(features.storage) || features.storage <= 0) {
      throw new Error('Storage limit must be a positive integer');
    }
  }

  /**
   * Cria um produto e preço no Stripe
   */
  private async createStripeProductAndPrice(config: PlanConfig) {
    try {
      // Criar produto no Stripe
      const product = await stripe.products.create({
        name: config.name,
        description: config.description,
        metadata: {
          projects: config.features.projects.toString(),
          apiCalls: config.features.apiCalls.toString(),
          storage: config.features.storage.toString(),
        },
      });

      // Criar preço no Stripe
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: config.price,
        currency: 'usd',
        recurring: {
          interval: config.interval,
        },
      });

      return { product, price };
    } catch (error) {
      console.error(`Error creating Stripe product for plan ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Cria um plano no banco de dados
   */
  private async createPlanInDatabase(
    config: PlanConfig,
    stripePriceId: string,
    stripeProductId: string,
  ) {
    try {
      const plan = await this.prisma.plan.create({
        data: {
          name: config.name,
          stripePriceId,
          stripeProductId,
          price: config.price,
          currency: 'usd',
          interval: config.interval,
          features: config.features,
          active: true,
        },
      });

      return plan;
    } catch (error) {
      console.error(`Error creating plan ${config.name} in database:`, error);
      throw error;
    }
  }

  /**
   * Atualiza um plano existente no banco de dados
   */
  private async updatePlanInDatabase(planId: string, config: PlanConfig) {
    try {
      const plan = await this.prisma.plan.update({
        where: { id: planId },
        data: {
          name: config.name,
          price: config.price,
          interval: config.interval,
          features: config.features,
        },
      });

      return plan;
    } catch (error) {
      console.error(`Error updating plan ${config.name} in database:`, error);
      throw error;
    }
  }

  /**
   * Verifica se um plano já existe
   */
  async planExists(name: string): Promise<boolean> {
    try {
      const existingPlan = await this.prisma.plan.findFirst({
        where: {
          name,
          active: true,
        },
      });

      return !!existingPlan;
    } catch (error) {
      console.error(`Error checking if plan ${name} exists:`, error);
      return false;
    }
  }

  /**
   * Obtém todos os planos ativos
   */
  async getActivePlans() {
    try {
      const plans = await this.prisma.plan.findMany({
        where: {
          active: true,
        },
        orderBy: {
          price: 'asc',
        },
      });

      return plans;
    } catch (error) {
      console.error('Error getting active plans:', error);
      throw error;
    }
  }

  /**
   * Cria um único plano
   */
  async createPlan(config: PlanConfig, options: { skipIfExists?: boolean } = {}) {
    this.validatePlanConfig(config);

    if (options.skipIfExists && (await this.planExists(config.name))) {
      console.log(`⏭️ Plan "${config.name}" already exists, skipping...`);
      return null;
    }

    console.log(`📋 Creating plan: ${config.name}...`);

    // Criar produto e preço no Stripe
    const { product, price } = await this.createStripeProductAndPrice(config);

    // Criar plano no banco de dados
    const plan = await this.createPlanInDatabase(config, price.id, product.id);

    console.log(
      `✅ Created plan: ${config.name} - $${(config.price / 100).toFixed(2)}/${config.interval}`,
    );

    return plan;
  }

  /**
   * Cria múltiplos planos
   */
  async seedPlans(configs: PlanConfig[], options: { skipIfExists?: boolean } = {}) {
    console.log('🌱 Starting plan seeding...');

    const results = [];

    for (const config of configs) {
      try {
        const plan = await this.createPlan(config, options);
        if (plan) {
          results.push(plan);
        }
      } catch (error) {
        console.error(`❌ Failed to create plan ${config.name}:`, error);
        throw error;
      }
    }

    console.log(`✅ Seeding complete! Created ${results.length} plans.`);
    return results;
  }

  /**
   * Desativa um plano (soft delete)
   */
  async deactivatePlan(name: string) {
    try {
      await this.prisma.plan.updateMany({
        where: {
          name,
          active: true,
        },
        data: {
          active: false,
        },
      });

      console.log(`🔒 Deactivated plan: ${name}`);
    } catch (error) {
      console.error(`Error deactivating plan ${name}:`, error);
      throw error;
    }
  }

  /**
   * Seed com os planos padrão
   */
  async seedDefaultPlans(options: { skipIfExists?: boolean } = { skipIfExists: true }) {
    return this.seedPlans(DEFAULT_PLANS, options);
  }

  /**
   * Limpa conexão com o banco
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Instância singleton para facilitar o uso
export const planSeeder = new PlanSeeder();
