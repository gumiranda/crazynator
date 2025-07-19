export interface WhitelabelConfig {
  brand: {
    name: string;
    tagline: string;
    description: string;
  };
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  logos: {
    main: string;
    favicon: string;
    alt: string;
  };
  meta: {
    title: string;
    description: string;
    keywords?: string[];
  };
  features: {
    pricing: boolean;
    signUp: boolean;
    signIn: boolean;
  };
  contact: {
    email?: string;
    website?: string;
    support?: string;
  };
}

// Default configuration - can be overridden by environment variables or external config
const defaultConfig: WhitelabelConfig = {
  brand: {
    name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Crazy Code',
    tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Build something with Crazy Code',
    description: process.env.NEXT_PUBLIC_BRAND_DESCRIPTION || 'Create apps and websites by chatting with AI',
  },
  colors: {
    primary: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#a48fff',
    secondary: process.env.NEXT_PUBLIC_SECONDARY_COLOR,
    accent: process.env.NEXT_PUBLIC_ACCENT_COLOR,
  },
  logos: {
    main: process.env.NEXT_PUBLIC_LOGO_MAIN || '/logo.svg',
    favicon: process.env.NEXT_PUBLIC_LOGO_FAVICON || '/favicon.ico',
    alt: process.env.NEXT_PUBLIC_LOGO_ALT || 'Logo',
  },
  meta: {
    title: process.env.NEXT_PUBLIC_META_TITLE || 'AI Code Generator',
    description: process.env.NEXT_PUBLIC_META_DESCRIPTION || 'Generate code and applications using AI',
    keywords: process.env.NEXT_PUBLIC_META_KEYWORDS?.split(',') || ['AI', 'code', 'generator', 'development'],
  },
  features: {
    pricing: process.env.NEXT_PUBLIC_ENABLE_PRICING !== 'false',
    signUp: process.env.NEXT_PUBLIC_ENABLE_SIGNUP !== 'false',
    signIn: process.env.NEXT_PUBLIC_ENABLE_SIGNIN !== 'false',
  },
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    website: process.env.NEXT_PUBLIC_CONTACT_WEBSITE,
    support: process.env.NEXT_PUBLIC_CONTACT_SUPPORT,
  },
};

// Function to load configuration from external source (JSON file, API, etc.)
export async function loadWhitelabelConfig(): Promise<WhitelabelConfig> {
  try {
    // Check if there's a custom config file
    if (process.env.NEXT_PUBLIC_CONFIG_URL) {
      const response = await fetch(process.env.NEXT_PUBLIC_CONFIG_URL);
      const customConfig = await response.json();
      return { ...defaultConfig, ...customConfig };
    }
    
    // Check for local config file
    if (typeof window === 'undefined') {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const configPath = path.join(process.cwd(), 'whitelabel.config.json');
        
        if (fs.existsSync(configPath)) {
          const configFile = fs.readFileSync(configPath, 'utf8');
          const customConfig = JSON.parse(configFile);
          return { ...defaultConfig, ...customConfig };
        }
      } catch (error) {
        console.warn('Could not load local config file:', error);
      }
    }
  } catch (error) {
    console.warn('Could not load custom whitelabel config:', error);
  }
  
  return defaultConfig;
}

// Singleton pattern for config
let configCache: WhitelabelConfig | null = null;

export async function getWhitelabelConfig(): Promise<WhitelabelConfig> {
  if (!configCache) {
    configCache = await loadWhitelabelConfig();
  }
  return configCache;
}

// Synchronous version for client-side usage (uses environment variables only)
export function getWhitelabelConfigSync(): WhitelabelConfig {
  return defaultConfig;
}

// Helper functions for common operations
export function getBrandName(): string {
  return getWhitelabelConfigSync().brand.name;
}

export function getPrimaryColor(): string {
  return getWhitelabelConfigSync().colors.primary;
}

export function getLogoUrl(): string {
  return getWhitelabelConfigSync().logos.main;
}

export function getLogoAlt(): string {
  return getWhitelabelConfigSync().logos.alt;
}