'use client';

import { useBrandName } from '@/hooks/use-whitelabel';
import { cn } from '@/lib/utils';

interface BrandTextProps {
  className?: string;
  variant?: 'default' | 'header' | 'small';
}

export function BrandText({ className, variant = 'default' }: BrandTextProps) {
  const brandName = useBrandName();
  
  const variantClasses = {
    default: 'text-lg font-semibold',
    header: 'text-2xl md:text-5xl font-bold',
    small: 'text-xs sm:text-sm font-medium',
  };
  
  return (
    <span className={cn(variantClasses[variant], className)}>
      {brandName}
    </span>
  );
}