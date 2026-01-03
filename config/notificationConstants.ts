/**
 * Notification Constants
 * Centralized configuration for notification timing, thresholds, and limits
 */

// ========================
// TIME CONSTANTS (in milliseconds)
// ========================

export const TIME_CONSTANTS = {
  // Base notification delays
  BASE_DELAY: 5 * 60 * 1000, // 5 minutes
  HIGH_FREQUENCY_DELAY: 3 * 60 * 1000, // 3 minutes
  LOW_FREQUENCY_DELAY: 10 * 60 * 1000, // 10 minutes
  
  // Quiet time
  QUIET_TIME_DELAY: 8 * 60 * 60 * 1000, // 8 hours
  
  // Maximum delays
  MAX_PREDICTIVE_DELAY: 4 * 60 * 60 * 1000, // 4 hours
  
  // Activity thresholds
  RECENT_ACTIVITY_THRESHOLD: 2 * 60 * 1000, // 2 minutes
  AWAY_THRESHOLD: 30 * 60 * 1000, // 30 minutes
  
  // Time unit conversions
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000
};

// ========================
// PROCRASTINATION THRESHOLDS (in days)
// ========================

export const PROCRASTINATION_THRESHOLDS = {
  MEDIUM: 2, // Days until medium risk
  HIGH: 5    // Days until high risk
};

// ========================
// NOTIFICATION LIMITS
// ========================

export const NOTIFICATION_LIMITS = {
  MAX_COMPLETION_HISTORY: 50, // Maximum number of completion times to track
  MIN_SAMPLE_SIZE_FOR_PREDICTION: 10, // Minimum completions for predictive insights
  OUTLIER_FREQUENCY_THRESHOLD: 1, // Frequency count to consider as outlier
  
  // Streak thresholds
  LOW_STREAK: 2,
  MEDIUM_STREAK: 5,
  
  // Engagement thresholds
  HIGH_ENGAGEMENT: 0.7,
  ML_CONFIDENCE_THRESHOLD: 0.6, // Minimum confidence for ML predictions
  ML_CELEBRATION_THRESHOLD: 0.7  // Prediction score for celebration messages
};

// ========================
// A/B TEST VARIANTS
// ========================

export const AB_TEST_VARIANTS = {
  FREQUENCY: ['control', 'high_frequency', 'low_frequency'],
  TIMING: ['control', 'optimal_hours', 'immediate'],
  TONE: ['encouraging', 'urgent', 'neutral']
};

// ========================
// PROCRASTINATION RISK FACTORS
// ========================

export const PROCRASTINATION_FACTORS = {
  // Hours of inactivity that indicate procrastination risk
  ACTIVITY_TIMEOUT_HOURS: 2,
  
  // Multipliers for delay calculation
  RECENT_ACTIVITY_MULTIPLIER: 3, // Wait 3x longer if recently active
  DEFAULT_MULTIPLIER: 2          // Default wait multiplier
};

// ========================
// NOTIFICATION TYPES
// ========================

export const NOTIFICATION_TYPES = {
  CONTEXTUAL: 'contextual',
  MOTIVATIONAL: 'motivational',
  INTERVENTION: 'intervention'
} as const;

// ========================
// MESSAGE PROBABILITIES
// ========================

export const MESSAGE_PROBABILITIES = {
  MOTIVATIONAL_CHANCE: 0.7 // 70% chance to use motivational vs contextual
};

// ========================
// RATE LIMITING
// ========================

export const RATE_LIMIT_CONFIG = {
  // Exponential backoff for notification queue (from notificationQueue.ts)
  BASE_BACKOFF_MS: 2000,      // 2 seconds
  MAX_BACKOFF_MS: 300000,     // 5 minutes
  BACKOFF_MULTIPLIER: 2,
  JITTER_FACTOR: 0.1,         // 10% random jitter
  QUEUE_PROCESS_INTERVAL_MS: 10000  // Process queue every 10 seconds
};
