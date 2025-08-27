import { Metadata } from 'next';
import { seoConfig, keywords } from './seo-config';

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  openGraph?: OpenGraphData;
  twitter?: TwitterCardData;
  structuredData?: StructuredDataType[];
}

export interface OpenGraphData {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  type: 'website' | 'article' | 'product';
  url: string;
}

export interface TwitterCardData {
  card: 'summary' | 'summary_large_image';
  title: string;
  description: string;
  image: string;
  creator?: string;
}

export type StructuredDataType =
  | OrganizationSchema
  | WebsiteSchema
  | SoftwareApplicationSchema
  | ProductSchema;

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
}

export interface WebsiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
  potentialAction: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

export interface SoftwareApplicationSchema {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication';
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers?: OfferSchema[];
}

export interface ProductSchema {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  offers: OfferSchema[];
  brand: BrandSchema;
}

export interface OfferSchema {
  '@type': 'Offer';
  price: string;
  priceCurrency: string;
  availability: string;
  url: string;
}

export interface BrandSchema {
  '@type': 'Brand';
  name: string;
}

/**
 * Generate comprehensive metadata for Next.js pages
 */
export function generateMetadata({
  title,
  description,
  canonical,
  openGraph,
  twitter,
  keywords: pageKeywords,
}: PageSEO): Metadata {
  const fullTitle = title === seoConfig.site.name ? title : `${title} | ${seoConfig.site.name}`;
  const ogImage = openGraph?.image || `${seoConfig.site.url}/og-default.jpg`;

  return {
    title: fullTitle,
    description,
    keywords: pageKeywords || [...keywords.primary, ...keywords.secondary],
    authors: [{ name: 'CrazyNator Team' }],
    creator: 'CrazyNator',
    publisher: 'CrazyNator',
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
    alternates: {
      canonical: canonical || seoConfig.site.url,
    },
    openGraph: {
      type: openGraph?.type === 'product' ? 'website' : openGraph?.type || 'website',
      title: openGraph?.title || fullTitle,
      description: openGraph?.description || description,
      url: openGraph?.url || canonical || seoConfig.site.url,
      siteName: seoConfig.site.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: openGraph?.imageAlt || `${seoConfig.site.name} - ${title}`,
        },
      ],
      locale: 'pt_BR',
      alternateLocale: ['en_US'],
    },
    twitter: {
      card: twitter?.card || 'summary_large_image',
      title: twitter?.title || fullTitle,
      description: twitter?.description || description,
      images: [twitter?.image || ogImage],
      creator: twitter?.creator || seoConfig.social.twitter,
    },
    verification: {
      google: seoConfig.verification.google,
    },
    manifest: '/manifest.json',
    other: {
      'theme-color': '#a48fff',
    },
  };
}

/**
 * Generate page-specific SEO configurations
 */
export const pageSEO = {
  home: (): PageSEO => ({
    title: 'CrazyNator - Build Apps with AI',
    description:
      'Transform your ideas into fully functional web applications using AI. Create apps and websites by chatting with AI - no coding required. Start building today.',
    keywords: [...keywords.primary, ...keywords.longTail],
    canonical: seoConfig.site.url,
    openGraph: {
      title: 'CrazyNator - Build Apps with AI',
      description:
        'Transform your ideas into fully functional web applications using AI. No coding required.',
      image: `${seoConfig.site.url}/og-home.jpg`,
      imageAlt: 'CrazyNator - AI-powered app development platform',
      type: 'website',
      url: seoConfig.site.url,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'CrazyNator - Build Apps with AI',
      description: 'Transform your ideas into apps using AI. No coding required.',
      image: `${seoConfig.site.url}/og-home.jpg`,
    },
  }),

  pricing: (): PageSEO => ({
    title: 'Pricing Plans - CrazyNator',
    description:
      'Choose the perfect plan for your AI-powered app development needs. Free tier available. Affordable pricing for individuals and teams.',
    keywords: [
      'crazynator pricing',
      'ai app builder cost',
      'no-code platform pricing',
      'app development plans',
      ...keywords.secondary,
    ],
    canonical: `${seoConfig.site.url}/pricing`,
    openGraph: {
      title: 'CrazyNator Pricing - Choose Your Plan',
      description: 'Affordable AI-powered app development plans. Free tier available.',
      image: `${seoConfig.site.url}/og-pricing.jpg`,
      imageAlt: 'CrazyNator pricing plans and features',
      type: 'website',
      url: `${seoConfig.site.url}/pricing`,
    },
  }),

  dashboard: (): PageSEO => ({
    title: 'Dashboard - Your Projects',
    description:
      'Manage your AI-generated projects and applications. View, edit, and deploy your apps built with CrazyNator.',
    canonical: `${seoConfig.site.url}/dashboard`,
    openGraph: {
      title: 'CrazyNator Dashboard',
      description: 'Manage your AI-generated projects and applications',
      image: `${seoConfig.site.url}/og-dashboard.jpg`,
      imageAlt: 'CrazyNator user dashboard',
      type: 'website',
      url: `${seoConfig.site.url}/dashboard`,
    },
  }),

  project: (projectName?: string): PageSEO => ({
    title: projectName ? `${projectName} - Project` : 'Project - CrazyNator',
    description: projectName
      ? `View and edit your ${projectName} project built with CrazyNator's AI-powered development platform.`
      : 'View and edit your AI-generated project with real-time preview and code editing capabilities.',
    canonical: `${seoConfig.site.url}/projects/${projectName || 'project'}`,
    openGraph: {
      title: projectName ? `${projectName} Project` : 'AI-Generated Project',
      description: 'Real-time AI-powered project development and editing',
      image: `${seoConfig.site.url}/og-project.jpg`,
      imageAlt: projectName ? `${projectName} project preview` : 'AI-generated project',
      type: 'article',
      url: `${seoConfig.site.url}/projects/${projectName || 'project'}`,
    },
  }),
};

/**
 * Create organization structured data
 */
export function createOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoConfig.site.name,
    url: seoConfig.site.url,
    logo: `${seoConfig.site.url}${seoConfig.site.logo}`,
    description: seoConfig.site.description,
    sameAs: [
      seoConfig.social.twitter
        ? `https://twitter.com/${seoConfig.social.twitter.replace('@', '')}`
        : '',
      seoConfig.social.facebook || '',
      seoConfig.social.linkedin || '',
    ].filter(Boolean),
  };
}

/**
 * Create website structured data with search action
 */
export function createWebsiteSchema(): WebsiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoConfig.site.name,
    url: seoConfig.site.url,
    description: seoConfig.site.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${seoConfig.site.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Create software application structured data
 */
export function createSoftwareApplicationSchema(): SoftwareApplicationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: seoConfig.site.name,
    description: seoConfig.site.description,
    url: seoConfig.site.url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web Browser',
  };
}

/**
 * Utility to truncate description to optimal length
 */
export function optimizeDescription(description: string, maxLength = 160): string {
  if (description.length <= maxLength) return description;

  const truncated = description.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');

  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${seoConfig.site.url}${cleanPath}`;
}
