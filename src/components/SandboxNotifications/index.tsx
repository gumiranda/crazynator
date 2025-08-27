'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCwIcon, CheckCircleIcon, AlertCircleIcon, XCircleIcon } from 'lucide-react';

export interface SandboxNotification {
  type: 'recreating' | 'success' | 'error' | 'warning';
  message: string;
  fragmentId?: string;
  duration?: number;
}

export interface SandboxNotificationContextType {
  showNotification: (notification: SandboxNotification) => void;
  showRecreationProgress: (fragmentId: string) => void;
  showRecreationSuccess: (fragmentId: string, newUrl: string) => void;
  showRecreationError: (fragmentId: string, error: string) => void;
}

// Toast notification functions for sandbox recreation
export const showSandboxNotification = (notification: SandboxNotification) => {
  const { type, message, duration = 5000 } = notification;

  switch (type) {
    case 'recreating':
      toast.loading(message, {
        icon: <RefreshCwIcon className="h-4 w-4 animate-spin" />,
        duration: Infinity, // Keep showing until manually dismissed
        id: `recreating-${notification.fragmentId}`,
      });
      break;

    case 'success':
      toast.success(message, {
        icon: <CheckCircleIcon className="h-4 w-4" />,
        duration,
        id: `success-${notification.fragmentId}`,
      });
      break;

    case 'error':
      toast.error(message, {
        icon: <XCircleIcon className="h-4 w-4" />,
        duration: duration || 8000, // Longer duration for errors
        id: `error-${notification.fragmentId}`,
        action: {
          label: 'Retry',
          onClick: () => {
            // This will be handled by the parent component
            window.dispatchEvent(
              new CustomEvent('sandbox-retry', {
                detail: { fragmentId: notification.fragmentId },
              })
            );
          },
        },
      });
      break;

    case 'warning':
      toast.warning(message, {
        icon: <AlertCircleIcon className="h-4 w-4" />,
        duration,
        id: `warning-${notification.fragmentId}`,
      });
      break;
  }
};

export const showRecreationProgress = (fragmentId: string) => {
  showSandboxNotification({
    type: 'recreating',
    message: 'Recreating expired sandbox...',
    fragmentId,
  });
};

export const showRecreationSuccess = (fragmentId: string, _newUrl: string) => {
  // Dismiss the loading toast
  toast.dismiss(`recreating-${fragmentId}`);
  
  showSandboxNotification({
    type: 'success',
    message: 'Sandbox recreated successfully! Preview will reload automatically.',
    fragmentId,
    duration: 4000,
  });
};

export const showRecreationError = (fragmentId: string, error: string) => {
  // Dismiss the loading toast
  toast.dismiss(`recreating-${fragmentId}`);
  
  showSandboxNotification({
    type: 'error',
    message: `Failed to recreate sandbox: ${error}`,
    fragmentId,
  });
};

// Component for managing sandbox notifications
export default function SandboxNotifications() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      toast.warning('You are offline. Sandbox recreation is paused and will resume when connection is restored.', {
        id: 'offline-warning',
        duration: Infinity,
      });
    } else {
      toast.dismiss('offline-warning');
    }
  }, [isOnline]);

  return null; // This component only manages notifications
}