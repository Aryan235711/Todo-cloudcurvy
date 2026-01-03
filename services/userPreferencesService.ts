/**
 * User Preferences Service
 * Manages user settings including haptic feedback preferences
 */

import { safeJsonParse } from '../utils/safeJson';
import { storageQuota } from '../utils/storageQuota';
import { logger } from '../utils/logger';

export interface UserPreferences {
  hapticFeedback: {
    enabled: boolean;
    intensity: 'light' | 'medium' | 'heavy';
    taskCompletion: boolean;
    navigation: boolean;
    notifications: boolean;
  };
  notifications: {
    enabled: boolean;
    quietHours: { start: number; end: number };
    frequency: 'low' | 'medium' | 'high';
  };
  ui: {
    theme: 'auto' | 'light' | 'dark';
    animations: boolean;
    compactMode: boolean;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  hapticFeedback: {
    enabled: true,
    intensity: 'medium',
    taskCompletion: true,
    navigation: true,
    notifications: true,
  },
  notifications: {
    enabled: true,
    quietHours: { start: 22, end: 7 },
    frequency: 'medium',
  },
  ui: {
    theme: 'auto',
    animations: true,
    compactMode: false,
  },
};

class UserPreferencesService {
  private preferences: UserPreferences;
  private readonly storageKey = 'curvycloud_user_preferences';

  constructor() {
    this.preferences = this.loadPreferences();
  }

  private loadPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = safeJsonParse<Partial<UserPreferences>>(stored, {});
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      logger.warn('[UserPreferences] Failed to load user preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    } catch (error) {
      logger.warn('[UserPreferences] Failed to save user preferences:', error);
    }
  }

  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  updateHapticPreferences(updates: Partial<UserPreferences['hapticFeedback']>): void {
    this.preferences.hapticFeedback = { ...this.preferences.hapticFeedback, ...updates };
    this.savePreferences();
  }

  updateNotificationPreferences(updates: Partial<UserPreferences['notifications']>): void {
    this.preferences.notifications = { ...this.preferences.notifications, ...updates };
    this.savePreferences();
  }

  updateUIPreferences(updates: Partial<UserPreferences['ui']>): void {
    this.preferences.ui = { ...this.preferences.ui, ...updates };
    this.savePreferences();
  }

  shouldTriggerHaptic(type: 'taskCompletion' | 'navigation' | 'notifications'): boolean {
    return this.preferences.hapticFeedback.enabled && this.preferences.hapticFeedback[type];
  }

  getHapticIntensity(): 'light' | 'medium' | 'heavy' {
    return this.preferences.hapticFeedback.intensity;
  }

  isQuietTime(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const { start, end } = this.preferences.notifications.quietHours;
    return start > end ? (hour >= start || hour < end) : (hour >= start && hour < end);
  }
}

export const userPreferencesService = new UserPreferencesService();