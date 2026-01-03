/**
 * Conditional Logger Utility
 * Prevents console log clutter in production while maintaining dev debugging
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

class ConditionalLogger {
  private isDevelopment = import.meta.env.DEV;
  private enabledInProduction = new Set<string>(['error', 'warn']);

  /**
   * Log message with conditional output based on environment
   */
  log(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.log(message, ...args);
    }
  }

  /**
   * Info level logging
   */
  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.info(message, ...args);
    }
  }

  /**
   * Warning level logging (enabled in production)
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args);
  }

  /**
   * Error level logging (enabled in production)
   */
  error(message: string, ...args: unknown[]): void {
    console.error(message, ...args);
  }

  /**
   * Debug level logging (dev only)
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.debug(message, ...args);
    }
  }

  /**
   * Feature-specific logging with emoji prefix
   */
  feature(feature: string, message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      const emoji = this.getFeatureEmoji(feature);
      console.log(`${emoji} [${feature}]`, message, ...args);
    }
  }

  /**
   * Performance tracking log
   */
  perf(label: string, duration: number): void {
    if (this.isDevelopment) {
      console.log(`⚡ [Performance] ${label}: ${duration.toFixed(2)}ms`);
    }
  }

  private getFeatureEmoji(feature: string): string {
    const emojiMap: Record<string, string> = {
      'voice': '🎤',
      'ai': '✨',
      'neural-nudge': '🧠',
      'storage': '💾',
      'network': '🌐',
      'analytics': '📊',
      'security': '🔒',
      'test': '🧪'
    };
    return emojiMap[feature.toLowerCase()] || '🔵';
  }

  /**
   * Group related logs (dev only)
   */
  group(label: string, callback: () => void): void {
    if (this.isDevelopment) {
      console.group(label);
      try {
        callback();
      } finally {
        console.groupEnd();
      }
    }
  }

  /**
   * Table output for structured data (dev only)
   */
  table(data: unknown): void {
    if (this.isDevelopment && console.table) {
      console.table(data);
    }
  }
}

export const logger = new ConditionalLogger();
