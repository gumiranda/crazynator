import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { TRPCReactProvider } from '@/trpc/client';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { ClerkProvider } from '@clerk/nextjs';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';

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

export const metadata: Metadata = {
  title: {
    default: 'Crazy Code - Build Apps with AI | No-Code Development Platform',
    template: '%s | Crazy Code'
  },
  description: 'Create apps and websites by chatting with AI. Crazy Code is the revolutionary no-code platform that transforms your ideas into functional applications through natural language conversation.',
  keywords: [
    'AI app builder',
    'no-code platform',
    'AI website builder',
    'app development',
    'artificial intelligence',
    'chatbot development',
    'low-code',
    'web development',
    'mobile app builder',
    'AI programming'
  ],
  authors: [{ name: 'Crazy Code Team' }],
  creator: 'Crazy Code',
  publisher: 'Crazy Code',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://crazycode.com'),
  alternates: {
    canonical: '/',
    languages: {
      'pt-BR': '/pt-BR',
      'en-US': '/en-US',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    title: 'Crazy Code - Build Apps with AI | No-Code Development Platform',
    description: 'Create apps and websites by chatting with AI. Transform your ideas into functional applications through natural language conversation.',
    siteName: 'Crazy Code',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Crazy Code - AI-Powered App Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crazy Code - Build Apps with AI',
    description: 'Create apps and websites by chatting with AI. No-code development made simple.',
    images: ['/twitter-image.jpg'],
    creator: '@crazycode',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
    yandex: process.env.YANDEX_VERIFICATION_ID,
    yahoo: process.env.YAHOO_VERIFICATION_ID,
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ variables: { colorPrimary: '#a48fff' } }}>
      <TRPCReactProvider>
        <html lang="pt-BR" suppressHydrationWarning={true} data-lt-installed="true">
          <head>
            <link rel="icon" href="/favicon.ico" sizes="any" />
            <link rel="icon" href="/icon.svg" type="image/svg+xml" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#a48fff" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="Crazy Code" />
            <meta name="application-name" content="Crazy Code" />
            <meta name="msapplication-TileColor" content="#a48fff" />
            <meta name="msapplication-config" content="/browserconfig.xml" />
          </head>
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            {process.env.GOOGLE_ANALYTICS_ID && (
              <GoogleAnalytics ga_id={process.env.GOOGLE_ANALYTICS_ID} />
            )}
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
