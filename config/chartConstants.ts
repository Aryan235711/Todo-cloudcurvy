// Chart Configuration Constants - Centralized chart logic values
export const HEALTH_THRESHOLDS = {
  EXCELLENT: 0.9,
  GOOD: 0.75,
  FAIR: 0.6,
  POOR: 0.4,
  CRITICAL: 0.0
} as const;

export const RATE_LIMIT_THRESHOLDS = {
  CRITICAL: 0.9,
  WARNING: 0.7,
  HEALTHY: 0.0
} as const;

export const CALCULATION_WEIGHTS = {
  EFFECTIVENESS: {
    CONVERSION_RATE: 0.4,
    ENGAGEMENT_RATE: 0.3,
    PREDICTION_ACCURACY: 0.3
  },
  USER_SATISFACTION: {
    PREFERENCE_ALIGNMENT: 0.3,
    ENGAGEMENT_SCORE: 0.4,
    STREAK_BONUS: 0.2,
    TIMING_RESPECT: 0.1
  },
  SYSTEM_HEALTH: {
    RATE_LIMIT: 0.4,
    RESPONSE_TIME: 0.3,
    ERROR_RATE: 0.3
  }
} as const;

export const PERFORMANCE_THRESHOLDS = {
  RESPONSE_TIME: {
    GOOD_MS: 100,
    BAD_MS: 1000
  },
  AB_TEST: {
    CONFIDENCE_SAMPLE_SIZE: 100
  },
  TEST_COVERAGE: {
    MINIMUM_PERCENTAGE: 60
  }
} as const;

export const CHART_CONSTANTS = {
  PROGRESS_CIRCLE: {
    DEGREES_MULTIPLIER: 3.6 // 360 degrees / 100 percentage
  }
} as const;