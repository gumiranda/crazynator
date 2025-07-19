'use client';

import Image from 'next/image';
import { useLogos } from '@/hooks/use-whitelabel';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({ width = 24, height = 24, className, priority = false }: BrandLogoProps) {
  const logos = useLogos();
  
  return (
    <Image
      src={logos.main}
      alt={logos.alt}
      width={width}
      height={height}
      className={cn('shrink-0', className)}
      priority={priority}
    />
  );
}