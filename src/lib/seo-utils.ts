import type { Metadata } from 'next';

export const siteConfig = {
  name: 'Crazy Code',
  description: 'Create apps and websites by chatting with AI. Crazy Code is the revolutionary no-code platform that transforms your ideas into functional applications through natural language conversation.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://crazycode.com',
  ogImage: '/og-image.jpg',
  creator: '@crazycode',
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
};

export function generateMetadata({
  title,
  description,
  image = siteConfig.ogImage,
  noIndex = false,
  keywords = [],
}: {
  title: string;
  description: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [image],
      creator: siteConfig.creator,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generateStructuredData(type: 'organization' | 'website' | 'software') {
  const baseData = {
    '@context': 'https://schema.org',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.svg`,
  };

  switch (type) {
    case 'organization':
      return {
        ...baseData,
        '@type': 'Organization',
        sameAs: [
          // Add social media URLs here when available
        ],
      };
    
    case 'website':
      return {
        ...baseData,
        '@type': 'WebSite',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteConfig.url}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };
    
    case 'software':
      return {
        ...baseData,
        '@type': 'SoftwareApplication',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          category: 'subscription',
          url: `${siteConfig.url}/pricing`,
        },
        creator: {
          '@type': 'Organization',
          name: siteConfig.name,
        },
        featureList: [
          'AI-powered app development',
          'No-code website builder',
          'Natural language programming',
          'Real-time collaboration',
          'Multiple deployment options',
        ],
      };
    
    default:
      return baseData;
  }
}