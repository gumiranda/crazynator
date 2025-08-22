import { seoConfig } from '@/lib/seo-config';

export function GET() {
  const manifest = {
    name: seoConfig.site.name,
    short_name: 'CrazyNator',
    description: seoConfig.site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#a48fff',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    categories: ['business', 'productivity', 'developer'],
    screenshots: [
      {
        src: '/screenshots/desktop-home.jpg',
        sizes: '1280x720',
        type: 'image/jpeg',
        form_factor: 'wide',
        label: 'CrazyNator Home Page',
      },
      {
        src: '/screenshots/mobile-home.jpg',
        sizes: '390x844',
        type: 'image/jpeg',
        form_factor: 'narrow',
        label: 'CrazyNator Mobile Home',
      },
    ],
    shortcuts: [
      {
        name: 'Create New Project',
        short_name: 'New Project',
        description: 'Start building a new app with AI',
        url: '/?action=create',
        icons: [{ src: '/icons/new-project-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'My Dashboard',
        short_name: 'Dashboard',
        description: 'View your projects and manage your account',
        url: '/dashboard',
        icons: [{ src: '/icons/dashboard-96x96.png', sizes: '96x96' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}