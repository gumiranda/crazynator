import { useMemo } from 'react';
import { formatDuration, intervalToDuration } from 'date-fns';
import { useAuth } from '@clerk/nextjs';
import { CrownIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type UsageProps = {
  points: number;
  msBeforeNext: number;
};

export default function Usage({ points, msBeforeNext }: UsageProps) {
  const { has } = useAuth();
  const hasProAccess = has?.({ plan: 'pro' });

  const resetTime = useMemo(() => {
    try {
      return formatDuration(
        intervalToDuration({
          start: new Date(),
          end: new Date(Date.now() + msBeforeNext),
        }),
        {
          format: ['months', 'days', 'hours'],
        },
      );
    } catch {
      return 'N/A';
    }
  }, [msBeforeNext]);

  return (
    <div className="bg-background rounded-t-xl border border-b-0 p-2.5">
      <div className="flex items-center gap-x-2">
        <div>
          <p className="text-sm font-semibold">
            {points} {hasProAccess ? 'credits' : 'free credits'} remaining
          </p>
          <p className="text-muted-foreground text-xs">Reset in {resetTime}.</p>
        </div>
        {!hasProAccess && (
          <Button variant="default" size="sm" className="ml-auto" asChild>
            <Link href="/pricing">
              <CrownIcon className="h-4 w-4" />
              Upgrade
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
