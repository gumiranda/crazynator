import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Plans - Affordable AI App Development',
  description: 'Explore Crazy Code pricing plans. Choose the perfect plan for building AI-powered apps and websites. Flexible pricing for developers, startups, and enterprises. Start building today.',
  keywords: [
    'pricing plans',
    'AI app builder pricing',
    'no-code platform cost',
    'subscription plans',
    'development tools pricing',
    'enterprise plans'
  ],
  openGraph: {
    title: 'Crazy Code Pricing Plans - Affordable AI App Development',
    description: 'Choose the perfect plan for building AI-powered apps and websites. Flexible pricing for developers, startups, and enterprises.',
    images: [
      {
        url: '/og-pricing.jpg',
        width: 1200,
        height: 630,
        alt: 'Crazy Code Pricing Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crazy Code Pricing Plans',
    description: 'Flexible pricing for AI-powered app development. Choose your plan today.',
    images: ['/twitter-pricing.jpg'],
  },
  alternates: {
    canonical: '/pricing',
  },
};

interface Props {
  children: React.ReactNode;
}

export default function PricingLayout({ children }: Props) {
  return <>{children}</>;
}