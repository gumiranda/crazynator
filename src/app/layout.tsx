import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { TRPCReactProvider } from '@/trpc/client';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { ClerkProvider } from '@clerk/nextjs';
import { generateMetadata as generateSEOMetadata, pageSEO, createOrganizationSchema, createWebsiteSchema, createSoftwareApplicationSchema } from '@/lib/seo-utils';
import { StructuredData } from '@/components/seo/structured-data';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = generateSEOMetadata(pageSEO.home());

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = [
    createOrganizationSchema(),
    createWebsiteSchema(),
    createSoftwareApplicationSchema(),
  ];

  return (
    <ClerkProvider appearance={{ variables: { colorPrimary: '#a48fff' } }}>
      <TRPCReactProvider>
        <html lang="en" suppressHydrationWarning={true}>
          <head>
            <StructuredData data={structuredData} />
          </head>
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Toaster />
              {children}
            </ThemeProvider>
          </body>
        </html>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
