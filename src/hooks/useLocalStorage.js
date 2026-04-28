// ═══════════════════════════════════════════════════
//  useLocalStorage — persistent state with localStorage
// ═══════════════════════════════════════════════════
import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const val = value instanceof Function ? value(storedValue) : value;
      setStoredValue(val);
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  };

  return [storedValue, setValue];
}
