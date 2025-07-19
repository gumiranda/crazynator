'use client';

import { useState, useEffect } from 'react';
import { WhitelabelConfig, getWhitelabelConfig, getWhitelabelConfigSync } from '@/config/whitelabel';

// Hook for client-side usage with environment variables
export function useWhitelabel() {
  const [config, setConfig] = useState<WhitelabelConfig>(() => getWhitelabelConfigSync());
  
  useEffect(() => {
    // Load full config on client side if needed
    getWhitelabelConfig().then(setConfig);
  }, []);
  
  return config;
}

// Individual hooks for specific config parts
export function useBrandName(): string {
  const config = useWhitelabel();
  return config.brand.name;
}

export function useBrandTagline(): string {
  const config = useWhitelabel();
  return config.brand.tagline;
}

export function useBrandDescription(): string {
  const config = useWhitelabel();
  return config.brand.description;
}

export function usePrimaryColor(): string {
  const config = useWhitelabel();
  return config.colors.primary;
}

export function useLogos() {
  const config = useWhitelabel();
  return config.logos;
}

export function useFeatures() {
  const config = useWhitelabel();
  return config.features;
}

export function useMeta() {
  const config = useWhitelabel();
  return config.meta;
}

export function useContact() {
  const config = useWhitelabel();
  return config.contact;
}