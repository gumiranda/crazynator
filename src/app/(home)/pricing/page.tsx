'use client';

import { useCurrentTheme } from '@/hooks/use-current-theme';
import { PricingTable } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import Image from 'next/image';
import type { Metadata } from 'next';

// This would ideally be moved to a separate file if we convert to SSR
const pricingStructuredData = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Crazy Code",
  "description": "AI-powered no-code platform for building apps and websites",
  "url": "https://crazycode.com/pricing",
  "logo": "https://crazycode.com/logo.svg",
  "category": "Software Application",
  "brand": {
    "@type": "Brand",
    "name": "Crazy Code"
  }
};

export default function PricingPage() {
  const currentTheme = useCurrentTheme();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pricingStructuredData),
        }}
      />
      <div className="flex flex-col max-w-3xl mx-auto w-full">
        <section className="space-y-6 pt-[16vh] 2xl:pt-48">
          <div className="flex flex-col items-center">
            <Image
              src="/logo.svg"
              alt="Crazy Code - AI-Powered App Builder Logo"
              width={50}
              height={50}
              className="hidden md:block"
            />
          </div>
          <h1 className="text-xl md:text-3xl font-bold text-center">
            Crazy Code Pricing Plans
          </h1>
          <p className="text-muted-foreground text-center text-sm md:text-base">
            Choose the plan that fits your needs. Start building AI-powered apps today with flexible pricing options designed for developers, startups, and enterprises.
          </p>
          <PricingTable
            appearance={{
              baseTheme: currentTheme === 'dark' ? dark : undefined,
              elements: { pricingTableCard: 'border! shadow-none! rounded-lg!' },
            }}
          />
        </section>
      </div>
    </>
  );
}
