import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useToast = () => {
  const toast = ({ title, description, variant = 'default', action }: ToastProps) => {
    const message = title || description || '';
    const fullMessage = title && description ? `${title}: ${description}` : message;

    if (variant === 'destructive') {
      return sonnerToast.error(fullMessage, {
        action: action ? {
          label: action.label,
          onClick: action.onClick,
        } : undefined,
      });
    }

    return sonnerToast.success(fullMessage, {
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    });
  };

  return { toast };
};