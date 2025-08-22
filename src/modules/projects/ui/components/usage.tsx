import { useMemo } from 'react';
import { formatDuration, intervalToDuration } from 'date-fns';
import { CrownIcon, AlertTriangleIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { UsageStatus } from '@/lib/usage';

type UsageProps = UsageStatus;

export default function Usage({ 
  remainingPoints, 
  msBeforeNext, 
  plan, 
  isLowCredits, 
  creditsPercentage 
}: UsageProps) {
  const hasProAccess = plan.type === 'PRO';
  const hasBasicAccess = plan.type === 'BASIC';

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

  const getUpgradeText = () => {
    if (hasProAccess) return null;
    if (hasBasicAccess) return 'Upgrade to Pro';
    return 'Upgrade';
  };

  const getPlanBadgeVariant = () => {
    if (hasProAccess) return 'default';
    if (hasBasicAccess) return 'secondary';
    return 'outline';
  };

  return (
    <div className="bg-background rounded-t-xl border border-b-0 p-2 sm:p-2.5 space-y-2">
      {/* Low Credits Warning */}
      {isLowCredits && remainingPoints > 0 && (
        <Alert className="py-2">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Running low on credits ({Math.round(creditsPercentage * 100)}% remaining). 
            {!hasProAccess && ' Consider upgrading for more credits.'}
          </AlertDescription>
        </Alert>
      )}
      
      {/* No Credits Warning */}
      {remainingPoints === 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription className="text-xs">
            No credits remaining on {plan.displayName} plan. 
            {!hasProAccess ? ' Please upgrade or wait for reset.' : ` Reset in ${resetTime}.`}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center gap-x-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm font-semibold">
              {remainingPoints} / {plan.credits} credits remaining
            </p>
            <Badge variant={getPlanBadgeVariant()} className="text-xs">
              {plan.displayName}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">Reset in {resetTime}.</p>
        </div>
        {!hasProAccess && getUpgradeText() && (
          <Button variant="default" size="sm" className="ml-auto shrink-0" asChild>
            <Link href="/pricing">
              <CrownIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{getUpgradeText()}</span>
              <span className="sm:hidden text-xs">Up</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
