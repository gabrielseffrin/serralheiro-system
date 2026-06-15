import { useState, useCallback } from 'react';

export function useToast(duration = 3000) {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      setMessage(msg);
      setTimeout(() => setMessage(null), duration);
    },
    [duration]
  );

  const dismissToast = useCallback(() => {
    setMessage(null);
  }, []);

  return { message, showToast, dismissToast };
}
