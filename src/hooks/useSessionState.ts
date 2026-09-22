'use client';

import { useCallback, useEffect, useState } from 'react';

export function useSessionState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const savedValue = window.sessionStorage.getItem(key);
      if (savedValue !== null) setValue(JSON.parse(savedValue) as T);
    } catch {
      window.sessionStorage.removeItem(key);
    } finally {
      setIsReady(true);
    }
  }, [key]);

  useEffect(() => {
    if (!isReady) return;
    window.sessionStorage.setItem(key, JSON.stringify(value));
  }, [isReady, key, value]);

  const clear = useCallback(() => {
    window.sessionStorage.removeItem(key);
    setValue(initialValue);
  }, [initialValue, key]);

  return [value, setValue, clear] as const;
}
