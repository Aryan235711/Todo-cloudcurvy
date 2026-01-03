/**
 * Storage Health Monitor
 * Monitors storage system health and provides automatic recovery
 */

import { logger } from './logger';
import { storageQuota } from './storageQuota';
import { STORAGE_KEYS, STORAGE_LIMITS, QUOTA_CONFIG } from '../constants/storageConstants';

interface HealthStatus {
  overall: 'healthy' | 'warning' | 'critical' | 'error';
  issues: HealthIssue[];
  metrics: HealthMetrics;
  timestamp: number;
}

interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'quota' | 'corruption' | 'performance' | 'availability';
  message: string;
  resolution?: string;
}

interface HealthMetrics {
  quotaUsagePercent: number;
  totalKeys: number;
  totalSizeKB: number;
  corruptedKeys: string[];
  largestKeys: Array<{ key: string; sizeKB: number }>;
  indexedDBAvailable: boolean;
  lastCheckTimestamp: number;
}

class StorageHealthMonitor {
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private lastHealthStatus: HealthStatus | null = null;

  /**
   * Start continuous health monitoring
   * @param intervalMs - Check interval in milliseconds (default: 5 minutes)
   */
  startMonitoring(intervalMs: number = 5 * 60 * 1000): void {
    if (this.healthCheckInterval) {
      logger.warn('[HealthMonitor] Already monitoring');
      return;
    }

    logger.log('[HealthMonitor] Starting health monitoring');
    
    // Initial check
    this.performHealthCheck();

    // Periodic checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.log('[HealthMonitor] Stopped health monitoring');
    }
  }

  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck(): Promise<HealthStatus> {
    const issues: HealthIssue[] = [];
    const metrics = await this.collectMetrics();

    // Check quota usage
    if (metrics.quotaUsagePercent >= QUOTA_CONFIG.CRITICAL_THRESHOLD * 100) {
      issues.push({
        severity: 'critical',
        category: 'quota',
        message: `Storage ${metrics.quotaUsagePercent.toFixed(1)}% full`,
        resolution: 'Run automatic cleanup or delete old data'
      });
    } else if (metrics.quotaUsagePercent >= QUOTA_CONFIG.WARNING_THRESHOLD * 100) {
      issues.push({
        severity: 'medium',
        category: 'quota',
        message: `Storage ${metrics.quotaUsagePercent.toFixed(1)}% full`,
        resolution: 'Consider cleaning up old data'
      });
    }

    // Check for corrupted keys
    if (metrics.corruptedKeys.length > 0) {
      issues.push({
        severity: 'high',
        category: 'corruption',
        message: `${metrics.corruptedKeys.length} corrupted storage keys detected`,
        resolution: 'Corrupted keys will be automatically removed on next access'
      });
    }

    // Check IndexedDB availability
    if (!metrics.indexedDBAvailable) {
      issues.push({
        severity: 'medium',
        category: 'availability',
        message: 'IndexedDB unavailable, using localStorage fallback',
        resolution: 'Check browser settings or privacy mode'
      });
    }

    // Check for oversized keys
    const oversizedKeys = metrics.largestKeys.filter(k => k.sizeKB > 100);
    if (oversizedKeys.length > 0) {
      issues.push({
        severity: 'low',
        category: 'performance',
        message: `${oversizedKeys.length} storage keys exceed 100KB`,
        resolution: 'Consider implementing data compression'
      });
    }

    // Determine overall health
    let overall: HealthStatus['overall'] = 'healthy';
    if (issues.some(i => i.severity === 'critical')) {
      overall = 'critical';
    } else if (issues.some(i => i.severity === 'high')) {
      overall = 'error';
    } else if (issues.length > 0) {
      overall = 'warning';
    }

    const status: HealthStatus = {
      overall,
      issues,
      metrics,
      timestamp: Date.now()
    };

    this.lastHealthStatus = status;

    // Log health status
    if (overall !== 'healthy') {
      logger.warn('[HealthMonitor] Health check:', status);
    } else {
      logger.log('[HealthMonitor] Health check: All systems normal');
    }

    // Auto-recovery for critical issues
    if (overall === 'critical') {
      await this.attemptAutoRecovery(status);
    }

    return status;
  }

  /**
   * Collect storage metrics
   */
  private async collectMetrics(): Promise<HealthMetrics> {
    const corruptedKeys: string[] = [];
    const keyData: Array<{ key: string; sizeKB: number }> = [];
    let totalSizeBytes = 0;

    // Analyze all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        const value = localStorage.getItem(key);
        if (value) {
          const sizeBytes = (key.length + value.length) * QUOTA_CONFIG.BYTES_PER_CHAR;
          const sizeKB = sizeBytes / 1024;
          
          totalSizeBytes += sizeBytes;
          keyData.push({ key, sizeKB });

          // Try parsing to detect corruption
          if (value.startsWith('{') || value.startsWith('[')) {
            try {
              JSON.parse(value);
            } catch {
              corruptedKeys.push(key);
            }
          }
        }
      } catch (error) {
        logger.error('[HealthMonitor] Error analyzing key:', key, error);
        corruptedKeys.push(key);
      }
    }

    // Sort by size descending
    keyData.sort((a, b) => b.sizeKB - a.sizeKB);

    // Get quota info
    const quotaInfo = await storageQuota.getQuotaInfo();
    const quotaUsagePercent = quotaInfo ? quotaInfo.percentage * 100 : 0;

    // Check IndexedDB availability
    const indexedDBAvailable = typeof indexedDB !== 'undefined';

    return {
      quotaUsagePercent,
      totalKeys: localStorage.length,
      totalSizeKB: totalSizeBytes / 1024,
      corruptedKeys,
      largestKeys: keyData.slice(0, 10), // Top 10
      indexedDBAvailable,
      lastCheckTimestamp: Date.now()
    };
  }

  /**
   * Attempt automatic recovery from critical issues
   */
  private async attemptAutoRecovery(status: HealthStatus): Promise<void> {
    logger.warn('[HealthMonitor] Attempting auto-recovery for critical issues');

    // Remove corrupted keys
    if (status.metrics.corruptedKeys.length > 0) {
      logger.log('[HealthMonitor] Removing', status.metrics.corruptedKeys.length, 'corrupted keys');
      status.metrics.corruptedKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          logger.error('[HealthMonitor] Failed to remove corrupted key:', key, error);
        }
      });
    }

    // Run cleanup if quota critical
    const quotaIssue = status.issues.find(i => i.category === 'quota' && i.severity === 'critical');
    if (quotaIssue) {
      logger.log('[HealthMonitor] Running emergency cleanup');
      try {
        const { defaultCleanupStrategies } = await import('./storageQuota');
        await storageQuota.cleanupStorage(defaultCleanupStrategies);
      } catch (error) {
        logger.error('[HealthMonitor] Cleanup failed:', error);
      }
    }
  }

  /**
   * Get last health check result
   */
  getLastHealthStatus(): HealthStatus | null {
    return this.lastHealthStatus;
  }

  /**
   * Generate health report for debugging
   */
  generateHealthReport(): string {
    if (!this.lastHealthStatus) {
      return 'No health check performed yet';
    }

    const { overall, issues, metrics } = this.lastHealthStatus;
    
    let report = `Storage Health Report\n`;
    report += `===================\n\n`;
    report += `Overall Status: ${overall.toUpperCase()}\n`;
    report += `Timestamp: ${new Date(this.lastHealthStatus.timestamp).toISOString()}\n\n`;
    
    report += `Metrics:\n`;
    report += `- Quota Usage: ${metrics.quotaUsagePercent.toFixed(1)}%\n`;
    report += `- Total Keys: ${metrics.totalKeys}\n`;
    report += `- Total Size: ${metrics.totalSizeKB.toFixed(2)} KB\n`;
    report += `- Corrupted Keys: ${metrics.corruptedKeys.length}\n`;
    report += `- IndexedDB: ${metrics.indexedDBAvailable ? 'Available' : 'Unavailable'}\n\n`;
    
    if (issues.length > 0) {
      report += `Issues (${issues.length}):\n`;
      issues.forEach((issue, i) => {
        report += `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}\n`;
        if (issue.resolution) {
          report += `   Resolution: ${issue.resolution}\n`;
        }
      });
    } else {
      report += `No issues detected\n`;
    }
    
    if (metrics.largestKeys.length > 0) {
      report += `\nLargest Storage Keys:\n`;
      metrics.largestKeys.slice(0, 5).forEach((item, i) => {
        report += `${i + 1}. ${item.key}: ${item.sizeKB.toFixed(2)} KB\n`;
      });
    }

    return report;
  }
}

// Export singleton
export const storageHealthMonitor = new StorageHealthMonitor();
