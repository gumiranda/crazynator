import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata, pageSEO } from '@/lib/seo-utils';

export const metadata: Metadata = generateSEOMetadata(pageSEO.pricing());

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}