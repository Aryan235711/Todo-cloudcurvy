/**
 * Storage Constants
 * Centralized configuration for all storage operations
 */

/**
 * LocalStorage Keys
 */
export const STORAGE_KEYS = {
  // Core data
  TODOS: 'curvycloud_todos',
  TEMPLATES: 'curvycloud_templates',
  
  // Offline queue
  OFFLINE_QUEUE: 'curvycloud_offline_queue',
  LAST_SYNC: 'curvycloud_last_sync',
  
  // User preferences
  USER_PREFERENCES: 'curvycloud_user_preferences',
  
  // Behavioral data
  BEHAVIORAL_MODELS: 'loop_behavioral_models',
  
  // Crash reporting
  CRASH_REPORTS: 'curvycloud_crash_reports',
  
  // Activity tracking
  ACTIVITY_PREFIX: 'curvycloud_activity_',
  
  // CSRF tokens
  CSRF_TOKEN: 'curvycloud_csrf_token',
} as const;

/**
 * Storage Size Limits
 */
export const STORAGE_LIMITS = {
  // Item limits
  MAX_TODOS: 1000,
  MAX_TEMPLATES: 100,
  MAX_QUEUE_SIZE: 100,
  MAX_CRASH_REPORTS: 50,
  MAX_CRASH_REPORTS_MINIMAL: 20,
  
  // Size limits (in KB)
  MAX_JSON_SIZE_KB: 1024,
  
  // Time limits (in days)
  BEHAVIORAL_MODEL_RETENTION_DAYS: 90,
  PATTERN_HISTORY_DAYS: 30,
  
  // Queue retention
  QUEUE_RETENTION_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * IndexedDB Configuration
 */
export const INDEXEDDB_CONFIG = {
  DATABASE_NAME: 'LoopCommunityDB',
  VERSION: 1,
  
  // Object stores
  STORES: {
    TODOS: 'todos',
    TEMPLATES: 'templates',
  },
  
  // Transaction timeouts (in ms)
  TRANSACTION_TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * Storage Quota Configuration
 */
export const QUOTA_CONFIG = {
  // Warning thresholds (percentage)
  WARNING_THRESHOLD: 0.8,  // 80% full
  CRITICAL_THRESHOLD: 0.95, // 95% full
  
  // Assumed quota for localStorage (browsers vary)
  ASSUMED_QUOTA_MB: 5,
  
  // Bytes per character (UTF-16)
  BYTES_PER_CHAR: 2,
} as const;

/**
 * Cross-Tab Sync Configuration
 */
export const SYNC_CONFIG = {
  CHANNEL_NAME: 'loop_storage_sync',
  
  // Debounce delays (in ms)
  DEBOUNCE_DELAY: 500,
  BATCH_DELAY: 300,
} as const;

/**
 * Storage Operation Timeouts
 */
export const TIMEOUTS = {
  INDEXEDDB_INIT: 10000,        // 10 seconds
  TRANSACTION: 30000,            // 30 seconds
  CLEANUP_OPERATION: 5000,       // 5 seconds
} as const;

/**
 * Default Values
 */
export const STORAGE_DEFAULTS = {
  EMPTY_ARRAY: [] as const,
  EMPTY_OBJECT: {} as const,
} as const;

/**
 * Storage Event Names
 */
export const STORAGE_EVENTS = {
  QUOTA_WARNING: 'storage:quota:warning',
  QUOTA_CRITICAL: 'storage:quota:critical',
  SYNC_CONFLICT: 'storage:sync:conflict',
  MIGRATION_COMPLETE: 'storage:migration:complete',
  CORRUPTION_DETECTED: 'storage:corruption:detected',
} as const;

/**
 * Validation Patterns
 */
export const VALIDATION = {
  STORAGE_KEY_PATTERN: /^[a-zA-Z0-9_-]+$/,
  MAX_KEY_LENGTH: 256,
} as const;

/**
 * Type exports for better IDE support
 */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export type StorageEvent = typeof STORAGE_EVENTS[keyof typeof STORAGE_EVENTS];
