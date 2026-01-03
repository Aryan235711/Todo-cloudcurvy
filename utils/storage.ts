/**
 * Common Storage Utilities
 * Centralized localStorage operations with safe error handling
 */

import { safeJsonParse, safeJsonStringify } from './safeJson';

/**
 * Get item from localStorage with type safety and fallback
 */
export function getLocalStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return safeJsonParse(item, fallback);
  } catch (error) {
    console.warn(`[Storage] Failed to get ${key}:`, error);
    return fallback;
  }
}

/**
 * Set item in localStorage with error handling
 */
export function setLocalStorage<T>(key: string, value: T): boolean {
  try {
    const serialized = safeJsonStringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`[Storage] Failed to set ${key}:`, error);
    return false;
  }
}

/**
 * Remove item from localStorage with error handling
 */
export function removeLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[Storage] Failed to remove ${key}:`, error);
    return false;
  }
}

/**
 * Clear all localStorage with error handling
 */
export function clearLocalStorage(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.warn('[Storage] Failed to clear:', error);
    return false;
  }
}

/**
 * Get multiple items from localStorage at once
 */
export function getMultipleLocalStorage<T extends Record<string, unknown>>(
  keys: Array<keyof T>,
  defaults: T
): T {
  const result = { ...defaults };
  
  keys.forEach((key) => {
    const stringKey = String(key);
    const item = localStorage.getItem(stringKey);
    if (item) {
      result[key] = safeJsonParse(item, defaults[key]);
    }
  });
  
  return result;
}

/**
 * Check if localStorage is available and working
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): {
  used: number;
  available: boolean;
  itemCount: number;
} {
  try {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const item = localStorage.getItem(key);
        used += (key.length + (item?.length || 0)) * 2; // Rough estimate in bytes
      }
    }
    
    return {
      used,
      available: isLocalStorageAvailable(),
      itemCount: localStorage.length
    };
  } catch {
    return {
      used: 0,
      available: false,
      itemCount: 0
    };
  }
}
