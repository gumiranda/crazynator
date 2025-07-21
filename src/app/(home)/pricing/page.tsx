'use client';

import Image from 'next/image';
import { PricingTable } from '@/modules/billing/ui/components/pricing-table';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';

export default function PricingPage() {
  const trpc = useTRPC();
  const { data: currentSubscription } = useQuery(
    trpc.billing.getSubscription.queryOptions()
  );

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full px-4">
      <section className="space-y-6 pt-[16vh] 2xl:pt-48">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.svg"
            alt="CrazyNator"
            width={50}
            height={50}
            className="hidden md:block"
          />
        </div>
        <h1 className="text-xl md:text-3xl font-bold text-center">Pricing</h1>
        <p className="text-muted-foreground text-center text-sm md:text-base">
          Choose the plan that fits your needs
        </p>
        <div className="pt-8">
          <PricingTable currentSubscription={currentSubscription} />
        </div>
      </section>
    </div>
  );
}
