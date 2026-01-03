/**
 * Storage Quota Management Utility
 * Handles localStorage/sessionStorage quota exceeded errors and provides cleanup strategies
 */

import { logger } from './logger';

export interface QuotaInfo {
  used: number;
  available: number;
  percentage: number;
}

export interface CleanupStrategy {
  name: string;
  execute: () => Promise<number>; // Returns bytes freed
}

class StorageQuotaManager {
  private readonly WARNING_THRESHOLD = 0.8; // 80% full
  private readonly CRITICAL_THRESHOLD = 0.95; // 95% full

  /**
   * Get estimated quota usage (not all browsers support quota API)
   */
  async getQuotaInfo(): Promise<QuotaInfo | null> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const available = estimate.quota || 0;
        const percentage = available > 0 ? used / available : 0;

        return {
          used,
          available,
          percentage
        };
      }

      // Fallback: estimate based on localStorage size
      return this.estimateLocalStorageSize();
    } catch (error) {
      logger.warn('[StorageQuota] Failed to get quota info:', error);
      return null;
    }
  }

  /**
   * Estimate localStorage usage
   */
  private estimateLocalStorageSize(): QuotaInfo {
    let totalSize = 0;
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
      }
    }

    // Assume 5-10MB limit for localStorage (varies by browser)
    const assumedQuota = 5 * 1024 * 1024; // 5MB
    
    return {
      used: totalSize * 2, // UTF-16 chars = 2 bytes each
      available: assumedQuota,
      percentage: (totalSize * 2) / assumedQuota
    };
  }

  /**
   * Check if storage is approaching quota limits
   */
  async checkQuotaWarning(): Promise<'ok' | 'warning' | 'critical'> {
    const info = await this.getQuotaInfo();
    if (!info) return 'ok';

    if (info.percentage >= this.CRITICAL_THRESHOLD) {
      logger.error(`[StorageQuota] CRITICAL: Storage ${(info.percentage * 100).toFixed(1)}% full (${this.formatBytes(info.used)}/${this.formatBytes(info.available)})`);
      return 'critical';
    }

    if (info.percentage >= this.WARNING_THRESHOLD) {
      logger.warn(`[StorageQuota] WARNING: Storage ${(info.percentage * 100).toFixed(1)}% full (${this.formatBytes(info.used)}/${this.formatBytes(info.available)})`);
      return 'warning';
    }

    return 'ok';
  }

  /**
   * Execute storage cleanup with registered strategies
   */
  async cleanupStorage(strategies: CleanupStrategy[]): Promise<number> {
    let totalFreed = 0;

    logger.log('[StorageQuota] Starting cleanup with', strategies.length, 'strategies');

    for (const strategy of strategies) {
      try {
        const freed = await strategy.execute();
        totalFreed += freed;
        logger.log(`[StorageQuota] Strategy "${strategy.name}" freed ${this.formatBytes(freed)}`);
      } catch (error) {
        logger.error(`[StorageQuota] Strategy "${strategy.name}" failed:`, error);
      }
    }

    logger.log(`[StorageQuota] Total freed: ${this.formatBytes(totalFreed)}`);
    return totalFreed;
  }

  /**
   * Safe write with automatic quota handling
   */
  safeWrite(
    key: string,
    value: string,
    storage: Storage = localStorage,
    onQuotaExceeded?: () => void
  ): boolean {
    try {
      storage.setItem(key, value);
      return true;
    } catch (error) {
      if (this.isQuotaExceededError(error)) {
        logger.error('[StorageQuota] QuotaExceededError when writing key:', key);
        
        // Call cleanup callback if provided
        if (onQuotaExceeded) {
          onQuotaExceeded();
        }

        // Try again after potential cleanup
        try {
          storage.setItem(key, value);
          return true;
        } catch (retryError) {
          logger.error('[StorageQuota] Write failed even after cleanup:', retryError);
          return false;
        }
      }

      logger.error('[StorageQuota] Unexpected error writing to storage:', error);
      return false;
    }
  }

  /**
   * Check if error is a quota exceeded error
   */
  isQuotaExceededError(error: any): boolean {
    return (
      error instanceof DOMException &&
      (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || // Firefox
        error.code === 22 || // Legacy code
        error.code === 1014 // Legacy code
      )
    );
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Get all localStorage keys sorted by size (descending)
   */
  getKeysBySize(): Array<{ key: string; size: number }> {
    const items: Array<{ key: string; size: number }> = [];

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key) || '';
        const size = (key.length + value.length) * 2; // UTF-16 = 2 bytes per char
        items.push({ key, size });
      }
    }

    return items.sort((a, b) => b.size - a.size);
  }

  /**
   * Remove oldest items from a timestamped array in localStorage
   */
  trimOldestItems(key: string, maxItems: number, storage: Storage = localStorage): number {
    try {
      const stored = storage.getItem(key);
      if (!stored) return 0;

      const items = JSON.parse(stored);
      if (!Array.isArray(items)) return 0;

      const originalLength = items.length;
      if (originalLength <= maxItems) return 0;

      // Assume items have a 'timestamp' or 'createdAt' field
      const sorted = items.sort((a, b) => {
        const timeA = a.timestamp || a.createdAt || 0;
        const timeB = b.timestamp || b.createdAt || 0;
        return timeB - timeA; // Newest first
      });

      const trimmed = sorted.slice(0, maxItems);
      storage.setItem(key, JSON.stringify(trimmed));

      const bytesFreed = (JSON.stringify(items).length - JSON.stringify(trimmed).length) * 2;
      return bytesFreed;
    } catch (error) {
      logger.error('[StorageQuota] Error trimming items:', error);
      return 0;
    }
  }

  /**
   * Clear all items matching a prefix
   */
  clearByPrefix(prefix: string, storage: Storage = localStorage): number {
    let bytesFreed = 0;
    const keysToRemove: string[] = [];

    for (let key in storage) {
      if (storage.hasOwnProperty(key) && key.startsWith(prefix)) {
        const value = storage.getItem(key) || '';
        bytesFreed += (key.length + value.length) * 2;
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => storage.removeItem(key));
    
    logger.log(`[StorageQuota] Cleared ${keysToRemove.length} items with prefix "${prefix}", freed ${this.formatBytes(bytesFreed)}`);
    return bytesFreed;
  }
}

// Export singleton instance
export const storageQuota = new StorageQuotaManager();

/**
 * Common cleanup strategies for Loop Community
 */
export const defaultCleanupStrategies: CleanupStrategy[] = [
  {
    name: 'Trim crash reports',
    execute: async () => storageQuota.trimOldestItems('curvycloud_crash_reports', 20)
  },
  {
    name: 'Clear old activity logs',
    execute: async () => storageQuota.clearByPrefix('curvycloud_activity_')
  },
  {
    name: 'Trim behavioral data history',
    execute: async () => storageQuota.trimOldestItems('curvycloud_behavioral_data', 100)
  },
  {
    name: 'Clear offline queue (completed)',
    execute: async () => {
      // Only clear completed items from offline queue
      const stored = localStorage.getItem('curvycloud_offline_queue');
      if (!stored) return 0;
      
      const queue = JSON.parse(stored);
      if (!Array.isArray(queue)) return 0;
      
      const pending = queue.filter(item => item.status !== 'completed');
      localStorage.setItem('curvycloud_offline_queue', JSON.stringify(pending));
      
      return (JSON.stringify(queue).length - JSON.stringify(pending).length) * 2;
    }
  }
];
