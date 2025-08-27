'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function GitHubPopupContent() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const success = searchParams.get('github_success');
    const error = searchParams.get('github_error');
    
    if (success === 'connected') {
      // Send success message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GITHUB_AUTH_SUCCESS',
          data: { success: true }
        }, window.location.origin);
      }
      window.close();
    } else if (error) {
      // Send error message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GITHUB_AUTH_ERROR',
          error: decodeURIComponent(error)
        }, window.location.origin);
      }
      window.close();
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing GitHub authentication...</p>
      </div>
    </div>
  );
}

export default function GitHubPopupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <GitHubPopupContent />
    </Suspense>
  );
}