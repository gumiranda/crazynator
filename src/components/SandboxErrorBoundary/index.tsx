'use client';

import React from 'react';
import { AlertTriangleIcon, RefreshCcwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SandboxErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface SandboxErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
  fragmentId?: string;
}

export default class SandboxErrorBoundary extends React.Component<
  SandboxErrorBoundaryProps,
  SandboxErrorBoundaryState
> {
  constructor(props: SandboxErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): SandboxErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Sandbox Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to your error reporting service here
    // For example: logErrorToService(error, errorInfo, this.props.fragmentId);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full h-full min-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangleIcon className="h-5 w-5" />
              Sandbox Error
            </CardTitle>
            <CardDescription>
              Something went wrong with the sandbox component
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {this.state.error?.message || 'Unknown error occurred'}
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold mb-2">
                  Technical Details (Development)
                </summary>
                <pre className="whitespace-pre-wrap bg-muted p-4 rounded text-xs overflow-auto">
                  {this.state.error?.stack}
                  {'\n\n'}
                  Component Stack:
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleRetry} variant="outline">
                <RefreshCcwIcon className="h-4 w-4 mr-2" />
                Retry
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
              >
                Reload Page
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>If this problem persists:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Try refreshing the page</li>
                <li>Check your internet connection</li>
                <li>The sandbox may have expired and needs recreation</li>
                <li>Contact support if the issue continues</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withSandboxErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<SandboxErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <SandboxErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </SandboxErrorBoundary>
    );
  };
}