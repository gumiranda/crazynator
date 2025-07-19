// Whitelabel Components
export { BrandLogo } from './brand-logo';
export { BrandText } from './brand-text';
export { BrandHeader } from './brand-header';
export { BrandHero } from './brand-hero';

// Re-export hooks for convenience
export {
  useWhitelabel,
  useBrandName,
  useBrandTagline,
  useBrandDescription,
  usePrimaryColor,
  useLogos,
  useFeatures,
  useMeta,
  useContact
} from '@/hooks/use-whitelabel';

// Re-export config functions
export {
  getWhitelabelConfig,
  getWhitelabelConfigSync,
  getBrandName,
  getPrimaryColor,
  getLogoUrl,
  getLogoAlt
} from '@/config/whitelabel';

// Types
export type { WhitelabelConfig } from '@/config/whitelabel';