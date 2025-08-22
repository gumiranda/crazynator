import { seoConfig } from '@/lib/seo-config';

export function GET() {
  const robotsTxt = `
# CrazyNator - AI-Powered App Builder
# Allow all search engines to crawl the site

User-agent: *
Allow: /

# Disallow authentication pages and API routes
Disallow: /api/
Disallow: /sign-in/
Disallow: /sign-up/
Disallow: /dashboard/settings/

# Allow specific API documentation if exists
Allow: /api/docs

# Sitemap location
Sitemap: ${seoConfig.site.url}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Common SEO-friendly directives
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /
  `.trim();

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}