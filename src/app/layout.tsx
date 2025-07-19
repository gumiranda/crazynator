import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { TRPCReactProvider } from '@/trpc/client';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { ClerkProvider } from '@clerk/nextjs';
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CodeAI Blog - Marketing de Conteúdo sobre IAs Geradoras de Código',
  description: 'Blog especializado em marketing de conteúdo sobre inteligências artificiais geradoras de código. Descubra as melhores estratégias, ferramentas e tendências do mercado.',
  keywords: 'IA, inteligência artificial, geração de código, marketing de conteúdo, GitHub Copilot, ChatGPT, desenvolvimento, programação',
  authors: [{ name: 'CodeAI Team' }],
  openGraph: {
    title: 'CodeAI Blog - Marketing de Conteúdo sobre IAs Geradoras de Código',
    description: 'Blog especializado em marketing de conteúdo sobre inteligências artificiais geradoras de código.',
    type: 'website',
    locale: 'pt_BR',
  },
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
