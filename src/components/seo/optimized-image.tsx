import Image, { ImageProps } from 'next/image';
import { getOptimizedImageProps, getContextualAltText } from '@/lib/image-utils';

interface OptimizedImageProps extends Omit<ImageProps, 'alt' | 'src'> {
  src: string;
  alt?: string;
  context?: 'logo' | 'hero' | 'feature' | 'profile' | 'product';
  entityName?: string;
  priority?: boolean;
  quality?: number;
}

export function OptimizedImage({
  src,
  alt,
  context = 'feature',
  entityName,
  priority = false,
  quality = 85,
  width,
  height,
  ...props
}: OptimizedImageProps) {
  const optimizedAlt = alt || getContextualAltText(context, entityName);
  
  const imageProps = getOptimizedImageProps({
    src,
    alt: optimizedAlt,
    width: width as number,
    height: height as number,
    priority,
    quality,
  });

  return <Image {...imageProps} width={width} height={height} alt={optimizedAlt} {...props} />;
}

// Specific components for common use cases
export function LogoImage({ className, priority = true, ...props }: Omit<OptimizedImageProps, 'context'>) {
  return (
    <OptimizedImage
      context="logo"
      priority={priority}
      className={className}
      {...props}
    />
  );
}

export function HeroImage({ className, priority = true, ...props }: Omit<OptimizedImageProps, 'context'>) {
  return (
    <OptimizedImage
      context="hero"
      priority={priority}
      className={className}
      {...props}
    />
  );
}

export function FeatureImage({ className, entityName, ...props }: Omit<OptimizedImageProps, 'context'>) {
  return (
    <OptimizedImage
      context="feature"
      entityName={entityName}
      className={className}
      {...props}
    />
  );
}