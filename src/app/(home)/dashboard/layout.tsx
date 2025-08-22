import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata, pageSEO } from '@/lib/seo-utils';

export const metadata: Metadata = generateSEOMetadata(pageSEO.dashboard());

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}