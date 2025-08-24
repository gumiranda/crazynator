'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCcwIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  XCircleIcon,
  PlayIcon,
  PauseIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface SandboxStats {
  total: number;
  active: number;
  expired: number;
  errors: number;
}

interface SandboxDashboardProps {
  projectId: string;
  className?: string;
}

export default function SandboxDashboard({ projectId, className }: SandboxDashboardProps) {
  const [stats, setStats] = useState<SandboxStats>({
    total: 0,
    active: 0,
    expired: 0,
    errors: 0,
  });
  const [isScanning, setIsScanning] = useState(false);
  const [isAutoScanEnabled, setIsAutoScanEnabled] = useState(true);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [progress, setProgress] = useState(0);

  const performHealthCheck = useCallback(async () => {
    setIsScanning(true);
    setProgress(0);

    try {
      // Get all fragments for this project
      const response = await fetch(`/api/projects/${projectId}/fragments`);
      if (!response.ok) {
        throw new Error('Failed to fetch fragments');
      }

      const fragments = await response.json();
      const total = fragments.length;
      
      if (total === 0) {
        setStats({ total: 0, active: 0, expired: 0, errors: 0 });
        setLastScan(new Date());
        return;
      }

      let active = 0;
      let expired = 0;
      let errors = 0;

      // Check each fragment's sandbox health
      for (let i = 0; i < fragments.length; i++) {
        const fragment = fragments[i];
        setProgress(((i + 1) / total) * 100);

        try {
          const healthResponse = await fetch('/api/sandbox/health-check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fragmentId: fragment.id,
            }),
          });

          if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            
            if (healthData.status.isExpired) {
              expired++;
            } else if (healthData.status.isConnectable) {
              active++;
            } else {
              errors++;
            }
          } else {
            errors++;
          }
        } catch (error) {
          console.error(`Health check failed for fragment ${fragment.id}:`, error);
          errors++;
        }

        // Small delay between checks
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setStats({
        total,
        active,
        expired,
        errors,
      });
      
      setLastScan(new Date());

      // Show notification if expired sandboxes found
      if (expired > 0) {
        toast.warning(`Found ${expired} expired sandbox${expired > 1 ? 'es' : ''}`, {
          action: {
            label: 'Auto-fix',
            onClick: () => triggerBatchRecreation(),
          },
        });
      }

    } catch (error) {
      console.error('Health check scan failed:', error);
      toast.error('Failed to perform sandbox health check');
    } finally {
      setIsScanning(false);
      setProgress(0);
    }
  }, [projectId]);

  // Auto-scan interval (every 5 minutes)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAutoScanEnabled) {
      interval = setInterval(() => {
        if (!isScanning) {
          performHealthCheck();
        }
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAutoScanEnabled, isScanning, performHealthCheck]);

  // Initial scan on component mount
  useEffect(() => {
    performHealthCheck();
  }, [performHealthCheck]);

  const triggerBatchRecreation = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sandbox/batch-recreate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Batch sandbox recreation started');
        // Refresh stats after a delay
        setTimeout(() => {
          performHealthCheck();
        }, 10000);
      } else {
        throw new Error('Failed to start batch recreation');
      }
    } catch (error) {
      console.error('Batch recreation failed:', error);
      toast.error('Failed to start batch sandbox recreation');
    }
  };

  const toggleAutoScan = () => {
    setIsAutoScanEnabled(!isAutoScanEnabled);
    toast.success(
      `Auto-scan ${!isAutoScanEnabled ? 'enabled' : 'disabled'}`
    );
  };

  const getHealthColor = () => {
    if (stats.total === 0) return 'text-muted-foreground';
    if (stats.expired > 0) return 'text-destructive';
    if (stats.errors > 0) return 'text-warning';
    return 'text-success';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Sandbox Health Monitor
              <Badge variant={stats.expired > 0 ? 'destructive' : 'secondary'}>
                {stats.total} total
              </Badge>
            </CardTitle>
            <CardDescription>
              {lastScan ? `Last scan: ${lastScan.toLocaleTimeString()}` : 'No scans performed'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleAutoScan}
              disabled={isScanning}
            >
              {isAutoScanEnabled ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              {isAutoScanEnabled ? 'Pause' : 'Resume'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={performHealthCheck}
              disabled={isScanning}
            >
              <RefreshCcwIcon className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
              Scan
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isScanning && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Scanning sandboxes...</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
              <span className="text-2xl font-bold text-green-500">{stats.active}</span>
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangleIcon className="h-5 w-5 text-yellow-500 mr-1" />
              <span className="text-2xl font-bold text-yellow-500">{stats.expired}</span>
            </div>
            <p className="text-sm text-muted-foreground">Expired</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-1" />
              <span className="text-2xl font-bold text-red-500">{stats.errors}</span>
            </div>
            <p className="text-sm text-muted-foreground">Errors</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <RefreshCcwIcon className="h-5 w-5 text-blue-500 mr-1" />
              <span className={`text-2xl font-bold ${getHealthColor()}`}>
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Health</p>
          </div>
        </div>

        {stats.expired > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              onClick={triggerBatchRecreation}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isScanning}
            >
              <RefreshCcwIcon className="h-4 w-4 mr-2" />
              Recreate All Expired Sandboxes ({stats.expired})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}