import { safeJsonParse } from '../utils/safeJson';

interface UserPreferences {
  confirmations: {
    deleteTask: boolean;
    deleteBundle: boolean;
    completeBundle: boolean;
  };
  gestures: {
    swipeToDelete: boolean;
    swipeToEdit: boolean;
    swipeToComplete: boolean;
  };
  autoSave: {
    enabled: boolean;
    delay: number; // milliseconds
  };
  hapticFeedback: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  confirmations: {
    deleteTask: true,
    deleteBundle: true,
    completeBundle: true
  },
  gestures: {
    swipeToDelete: true,
    swipeToEdit: true,
    swipeToComplete: true
  },
  autoSave: {
    enabled: true,
    delay: 2000
  },
  hapticFeedback: true
};

class PreferencesService {
  private preferences: UserPreferences = DEFAULT_PREFERENCES;

  init() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('loop_preferences');
      if (stored) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...safeJsonParse<Partial<UserPreferences>>(stored, {}) };
      }
    } catch {
      this.preferences = DEFAULT_PREFERENCES;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('loop_preferences', JSON.stringify(this.preferences));
    } catch {
      // Silent fail
    }
  }

  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  updatePreferences(updates: Partial<UserPreferences>) {
    this.preferences = {
      ...this.preferences,
      ...updates,
      confirmations: { ...this.preferences.confirmations, ...updates.confirmations },
      gestures: { ...this.preferences.gestures, ...updates.gestures },
      autoSave: { ...this.preferences.autoSave, ...updates.autoSave }
    };
    this.saveToStorage();
  }

  shouldShowDeleteConfirmation(): boolean {
    return this.preferences.confirmations.deleteTask;
  }

  shouldShowBundleDeleteConfirmation(): boolean {
    return this.preferences.confirmations.deleteBundle;
  }

  shouldShowBundleCompleteConfirmation(): boolean {
    return this.preferences.confirmations.completeBundle;
  }

  isGestureEnabled(gesture: keyof UserPreferences['gestures']): boolean {
    return this.preferences.gestures[gesture];
  }

  getAutoSaveDelay(): number {
    return this.preferences.autoSave.enabled ? this.preferences.autoSave.delay : 0;
  }

  isHapticEnabled(): boolean {
    return this.preferences.hapticFeedback;
  }

  resetToDefaults() {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.saveToStorage();
  }
}

// Consolidate preferences services - use userPreferencesService as primary
export const shouldShowDeleteConfirmation = (): boolean => {
  return true; // Always show confirmation for safety
};

export const isGestureEnabled = (gesture: 'swipeToDelete' | 'swipeToEdit'): boolean => {
  return true; // Always enable gestures
};

export const preferencesService = new PreferencesService();