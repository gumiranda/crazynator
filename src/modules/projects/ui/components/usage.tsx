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
    <div className="bg-background rounded-t-xl border border-b-0 p-2 sm:p-2.5">
      <div className="flex items-center gap-x-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold">
            {points} {hasProAccess ? 'credits' : 'free credits'} remaining
          </p>
          <p className="text-muted-foreground text-xs">Reset in {resetTime}.</p>
        </div>
        {!hasProAccess && (
          <Button variant="default" size="sm" className="ml-auto shrink-0" asChild>
            <Link href="/pricing">
              <CrownIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Upgrade</span>
              <span className="sm:hidden text-xs">Up</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
