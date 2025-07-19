'use client';

import { BrandLogo } from './brand-logo';
import { BrandText } from './brand-text';
import { cn } from '@/lib/utils';

interface BrandHeaderProps {
  className?: string;
  logoSize?: number;
  textVariant?: 'default' | 'header' | 'small';
  showText?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export function BrandHeader({ 
  className, 
  logoSize = 24, 
  textVariant = 'default',
  showText = true,
  orientation = 'horizontal'
}: BrandHeaderProps) {
  const isVertical = orientation === 'vertical';
  
  return (
    <div className={cn(
      'flex items-center gap-2',
      isVertical && 'flex-col',
      className
    )}>
      <BrandLogo width={logoSize} height={logoSize} />
      {showText && <BrandText variant={textVariant} />}
    </div>
  );
}