'use client';

import type { ComponentProps, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type StatusProps = ComponentProps<typeof Badge> & {
  status: 'connected' | 'disconnected' | 'connecting';
};

export const InngestConnectionStatus = ({ className, status, ...props }: StatusProps) => (
  <Badge
    className={cn('flex items-center gap-2', 'group', status, className)}
    variant="secondary"
    {...props}
  />
);

export type StatusIndicatorProps = HTMLAttributes<HTMLSpanElement>;

export const InngestConnectionStatusIndicator = ({ className, ...props }: StatusIndicatorProps) => (
  <span className="relative flex h-2 w-2" {...props}>
    <span
      className={cn(
        'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
        'group-[.connected]:bg-emerald-500',
        'group-[.disconnected]:bg-red-500',
        'group-[.connecting]:bg-amber-500',
      )}
    />
    <span
      className={cn(
        'relative inline-flex h-2 w-2 rounded-full',
        'group-[.connected]:bg-emerald-500',
        'group-[.disconnected]:bg-red-500',
        'group-[.connecting]:bg-amber-500',
        className,
      )}
    />
  </span>
);

export type StatusLabelProps = HTMLAttributes<HTMLSpanElement>;

export const InngestConnectionStatusLabel = ({
  className,
  children,
  ...props
}: StatusLabelProps) => (
  <span className={cn('text-muted-foreground', className)} {...props}>
    {children ?? (
      <>
        <span className="hidden group-[.connected]:block">Connected</span>
        <span className="hidden group-[.disconnected]:block">Disconnected</span>
        <span className="hidden group-[.connecting]:block">Connecting...</span>
      </>
    )}
  </span>
);
