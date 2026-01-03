/**
 * Cross-Tab Storage Synchronization
 * Keeps localStorage in sync across multiple browser tabs
 */

import { logger } from './logger';

type StorageChangeHandler = (key: string, newValue: string | null, oldValue: string | null) => void;

class CrossTabSync {
  private channel: BroadcastChannel | null = null;
  private handlers = new Map<string, Set<StorageChangeHandler>>();
  private readonly CHANNEL_NAME = 'loop_storage_sync';

  constructor() {
    this.init();
  }

  /**
   * Initialize cross-tab synchronization
   */
  private init(): void {
    // Check BroadcastChannel support
    if (typeof BroadcastChannel === 'undefined') {
      logger.warn('[CrossTabSync] BroadcastChannel not supported, using storage events only');
      this.setupStorageListener();
      return;
    }

    try {
      this.channel = new BroadcastChannel(this.CHANNEL_NAME);
      
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      // Note: BroadcastChannel doesn't have onerror in all browsers
      // Errors will be caught in postMessage try-catch instead

      logger.log('[CrossTabSync] Initialized with BroadcastChannel');
    } catch (error) {
      logger.warn('[CrossTabSync] Failed to create BroadcastChannel, using storage events:', error);
      this.setupStorageListener();
    }
  }

  /**
   * Fallback to storage event listener for older browsers
   */
  private setupStorageListener(): void {
    window.addEventListener('storage', (event) => {
      if (event.key && event.storageArea === localStorage) {
        this.notifyHandlers(event.key, event.newValue, event.oldValue);
      }
    });
  }

  /**
   * Handle incoming sync messages
   */
  private handleMessage(data: { key: string; newValue: string | null; oldValue: string | null }): void {
    if (data && typeof data.key === 'string') {
      this.notifyHandlers(data.key, data.newValue, data.oldValue);
    }
  }

  /**
   * Notify all registered handlers for a key
   */
  private notifyHandlers(key: string, newValue: string | null, oldValue: string | null): void {
    const handlers = this.handlers.get(key);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(key, newValue, oldValue);
        } catch (error) {
          logger.error('[CrossTabSync] Handler error:', error);
        }
      });
    }

    // Also notify wildcard handlers (listening to all keys)
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler(key, newValue, oldValue);
        } catch (error) {
          logger.error('[CrossTabSync] Wildcard handler error:', error);
        }
      });
    }
  }

  /**
   * Broadcast a storage change to other tabs
   */
  broadcast(key: string, newValue: string | null, oldValue: string | null = null): void {
    if (this.channel) {
      try {
        this.channel.postMessage({ key, newValue, oldValue });
      } catch (error) {
        logger.error('[CrossTabSync] Failed to broadcast:', error);
      }
    }
    // Storage events are automatically fired for other tabs, no need to manually trigger
  }

  /**
   * Subscribe to changes for a specific storage key
   * Use '*' to listen to all keys
   */
  subscribe(key: string, handler: StorageChangeHandler): () => void {
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
    }
    
    this.handlers.get(key)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(key);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(key);
        }
      }
    };
  }

  /**
   * Synchronized localStorage.setItem
   */
  setItem(key: string, value: string): void {
    const oldValue = localStorage.getItem(key);
    localStorage.setItem(key, value);
    this.broadcast(key, value, oldValue);
  }

  /**
   * Synchronized localStorage.removeItem
   */
  removeItem(key: string): void {
    const oldValue = localStorage.getItem(key);
    localStorage.removeItem(key);
    this.broadcast(key, null, oldValue);
  }

  /**
   * Synchronized localStorage.clear
   */
  clear(): void {
    // Broadcast removal of all keys
    const keys = Object.keys(localStorage);
    localStorage.clear();
    
    keys.forEach(key => {
      this.broadcast(key, null, null);
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.handlers.clear();
  }
}

// Export singleton instance
export const crossTabSync = new CrossTabSync();

/**
 * Helper function to sync a specific storage service across tabs
 */
export function syncStorageKey(
  key: string,
  onUpdate: (newValue: string | null) => void
): () => void {
  return crossTabSync.subscribe(key, (_, newValue) => {
    onUpdate(newValue);
  });
}

/**
 * React hook for cross-tab storage sync (if needed)
 */
export function useCrossTabSync(
  key: string,
  onUpdate: (newValue: string | null) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  return crossTabSync.subscribe(key, (_, newValue) => {
    onUpdate(newValue);
  });
}
