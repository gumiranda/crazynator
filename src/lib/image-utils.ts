import { seoConfig } from './seo-config';

/**
 * Standard image sizes for SEO and social media
 */
export const IMAGE_SIZES = {
  // Open Graph
  OG_DEFAULT: { width: 1200, height: 630 },
  OG_SQUARE: { width: 600, height: 600 },

  // Twitter Cards
  TWITTER_SUMMARY: { width: 300, height: 157 },
  TWITTER_LARGE: { width: 1200, height: 630 },

  // Favicons
  FAVICON_16: { width: 16, height: 16 },
  FAVICON_32: { width: 32, height: 32 },

  // Apple Touch Icons
  APPLE_TOUCH: { width: 180, height: 180 },

  // Android Chrome
  ANDROID_192: { width: 192, height: 192 },
  ANDROID_512: { width: 512, height: 512 },

  // PWA Icons
  PWA_96: { width: 96, height: 96 },
  PWA_128: { width: 128, height: 128 },
  PWA_256: { width: 256, height: 256 },
} as const;

/**
 * Generate optimized image props for Next.js Image component
 */
export function getOptimizedImageProps({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 85,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
}) {
  return {
    src,
    alt,
    width,
    height,
    priority,
    quality,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    placeholder: 'blur' as const,
    blurDataURL: `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="14">
          Loading...
        </text>
      </svg>`,
    ).toString('base64')}`,
  };
}

/**
 * Generate SEO-optimized image URLs
 */
export function getSEOImageUrl(imageName: string): string {
  const baseUrl = seoConfig.site.url;
  return `${baseUrl}/${imageName}`;
}

/**
 * Default SEO images configuration
 */
export const SEO_IMAGES = {
  // Open Graph images
  og: {
    default: getSEOImageUrl('og-default.jpg'),
    home: getSEOImageUrl('og-home.jpg'),
    pricing: getSEOImageUrl('og-pricing.jpg'),
    dashboard: getSEOImageUrl('og-dashboard.jpg'),
    project: getSEOImageUrl('og-project.jpg'),
  },

  // Favicons
  favicon: {
    ico: getSEOImageUrl('favicon.ico'),
    png16: getSEOImageUrl('favicon-16x16.png'),
    png32: getSEOImageUrl('favicon-32x32.png'),
  },

  // Android Chrome
  android: {
    chrome192: getSEOImageUrl('android-chrome-192x192.png'),
    chrome512: getSEOImageUrl('android-chrome-512x512.png'),
  },

  // PWA Screenshots
  screenshots: {
    desktop: getSEOImageUrl('screenshots/desktop-home.jpg'),
    mobile: getSEOImageUrl('screenshots/mobile-home.jpg'),
  },
} as const;

/**
 * Generate structured data for images
 */
export function generateImageStructuredData(
  imageUrl: string,
  alt: string,
  width?: number,
  height?: number,
) {
  return {
    '@type': 'ImageObject',
    url: imageUrl,
    caption: alt,
    width: width?.toString(),
    height: height?.toString(),
  };
}

/**
 * Validate image URLs for SEO
 */
export function validateSEOImage(imageUrl: string): boolean {
  try {
    const url = new URL(imageUrl);
    return url.protocol === 'https:' && url.pathname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get image alt text based on context
 */
export function getContextualAltText(
  context: 'logo' | 'hero' | 'feature' | 'profile' | 'product',
  entityName?: string,
): string {
  const siteName = seoConfig.site.name;

  switch (context) {
    case 'logo':
      return `${siteName} logo - AI-powered app development platform`;
    case 'hero':
      return `${siteName} - Transform ideas into apps with AI`;
    case 'feature':
      return entityName ? `${entityName} - ${siteName} feature` : `${siteName} platform features`;
    case 'profile':
      return entityName ? `${entityName} profile picture` : 'User profile picture';
    case 'product':
      return entityName
        ? `${entityName} - Product screenshot`
        : `${siteName} product demonstration`;
    default:
      return `${siteName} - AI-powered development platform`;
  }
}
