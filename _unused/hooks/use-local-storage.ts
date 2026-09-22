import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * React state synchronized with AsyncStorage (RN equivalent of the reference
 * web app's useLocalStorage). Reads the persisted value once on mount, then
 * keeps state and storage in sync. Supports functional updates like useState
 * and silently catches storage errors so in-memory state stays correct.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted value once on mount (async hydration).
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (cancelled) return;
        if (raw != null) {
          try {
            setStoredValue(JSON.parse(raw));
          } catch {
            // corrupt payload — keep initialValue
          }
        }
      })
      .catch(() => {
        // storage unavailable — keep initialValue
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          AsyncStorage.setItem(key, JSON.stringify(nextValue)).catch(() => {});
        } catch {
          // quota exceeded or storage unavailable
        }
        return nextValue;
      });
    },
    [key]
  );

  return [hydrated ? storedValue : initialValue, setValue];
}
