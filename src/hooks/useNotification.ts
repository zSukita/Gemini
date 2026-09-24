import { useState, useCallback, useRef, useEffect } from 'react';

export function useNotification() {
  const [notification, setNotification] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = useCallback((msg: string, durationMs: number = 4000) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setNotification(msg);
    timeoutRef.current = setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
      timeoutRef.current = null;
    }, durationMs);
  }, []);

  const clearNotification = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setNotification(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    notification,
    showNotification,
    clearNotification,
  };
}
