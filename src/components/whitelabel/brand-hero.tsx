'use client';

import { BrandLogo } from './brand-logo';
import { BrandText } from './brand-text';
import { useBrandDescription } from '@/hooks/use-whitelabel';

export function BrandHero() {
  const description = useBrandDescription();
  
  return (
    <>
      <div className="flex flex-col items-center">
        <BrandLogo
          width={50}
          height={50}
          className="hidden md:block"
        />
      </div>
      <BrandText variant="header" className="text-center" />
      <p className="text-lg md:text-xl text-muted-foreground text-center">
        {description}
      </p>
    </>
  );
}