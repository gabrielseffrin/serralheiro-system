import { useState, useCallback } from 'react';
import type { ToastVariant } from '@/components/Toast';

export function useToast(duration = 3000) {
  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<ToastVariant>('success');

  const showToast = useCallback(
    (msg: string, toastVariant: ToastVariant = 'success') => {
      setMessage(msg);
      setVariant(toastVariant);
      setTimeout(() => setMessage(null), duration);
    },
    [duration]
  );

  const dismissToast = useCallback(() => {
    setMessage(null);
  }, []);

  return { message, variant, showToast, dismissToast };
}
