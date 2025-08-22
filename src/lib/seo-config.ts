export interface SEOConfig {
  site: {
    name: string;
    description: string;
    url: string;
    logo: string;
    favicon: string;
  };
  social: {
    twitter: string;
    facebook?: string;
    linkedin?: string;
  };
  verification: {
    google?: string;
    yandex?: string;
    yahoo?: string;
  };
}

export const seoConfig: SEOConfig = {
  site: {
    name: 'CrazyNator',
    description: 'Transform your ideas into fully functional web applications using AI. Create apps and websites by chatting with AI - no coding required.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://crazynator.com',
    logo: '/logo.svg',
    favicon: '/favicon.ico',
  },
  social: {
    twitter: '@crazynator',
    facebook: 'https://facebook.com/crazynator',
    linkedin: 'https://linkedin.com/company/crazynator',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export const keywords = {
  primary: [
    'AI code generator',
    'no-code platform',
    'AI app builder',
    'automatic code generation',
    'AI-powered development',
  ],
  secondary: [
    'build apps with AI',
    'create websites AI',
    'automated development',
    'AI coding assistant',
    'rapid prototyping',
    'Next.js generator',
    'React app builder',
  ],
  longTail: [
    'create web applications using artificial intelligence',
    'build full-stack apps without coding',
    'AI-powered rapid application development',
    'generate React components with AI',
    'automated web development platform',
  ],
};