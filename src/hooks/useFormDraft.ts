import { useState, useEffect, useCallback } from 'react';

// In-memory fallback if localStorage is unavailable
const memoryStorage: Record<string, string> = {};

function getStorage(): Storage | { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; removeItem: (k: string) => void } {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage;
  }
  return {
    getItem: (k: string) => memoryStorage[k] ?? null,
    setItem: (k: string, v: string) => { memoryStorage[k] = v; },
    removeItem: (k: string) => { delete memoryStorage[k]; },
  };
}

export function saveDraftToStorage(key: string, data: any): void {
  try {
    const storage = getStorage();
    storage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[useFormDraft] Failed to save draft for key "${key}":`, err);
  }
}

export function loadDraftFromStorage<T>(key: string, fallback: T): T {
  try {
    const storage = getStorage();
    const item = storage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`[useFormDraft] Failed to load draft for key "${key}":`, err);
    return fallback;
  }
}

export function clearDraftFromStorage(key: string): void {
  try {
    const storage = getStorage();
    storage.removeItem(key);
  } catch (err) {
    console.warn(`[useFormDraft] Failed to clear draft for key "${key}":`, err);
  }
}

/**
 * Custom React hook for auto-saving and restoring form draft state to localStorage.
 * Ensures resilience against cellular drops or battery loss during field enumeration.
 */
export function useFormDraft<T>(storageKey: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);

  // Restore on mount
  useEffect(() => {
    const saved = loadDraftFromStorage<T>(storageKey, initialData);
    setData(saved);
    setIsLoaded(true);
  }, [storageKey]);

  // Update a single top-level field and immediately persist
  const updateField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setData((prev) => {
        const next = { ...prev, [key]: value };
        saveDraftToStorage(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const clearDraft = useCallback(() => {
    clearDraftFromStorage(storageKey);
    setData(initialData);
  }, [storageKey, initialData]);

  return {
    data,
    setData: (newData: React.SetStateAction<T>) => {
      setData((prev) => {
        const next = typeof newData === 'function' ? (newData as (p: T) => T)(prev) : newData;
        saveDraftToStorage(storageKey, next);
        return next;
      });
    },
    updateField,
    clearDraft,
    isLoaded,
  };
}
