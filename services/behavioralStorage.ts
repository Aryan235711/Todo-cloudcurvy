// Enhanced Behavioral Storage Service
import { LEARNING_CONSTANTS } from '../config/behavioralConstants';
import { safeJsonParse } from '../utils/safeJson';
import { logger } from '../utils/logger';
import { debounce } from '../utils/debounce';
import { storageQuota } from '../utils/storageQuota';
import { STORAGE_KEYS, STORAGE_LIMITS, SYNC_CONFIG } from '../constants/storageConstants';

interface UserOutcome {
  completed: boolean;
  engaged: boolean;
  ignored: boolean;
  frustrated: boolean;
}

interface StoredUserModel {
  messageEffectiveness: Record<string, number>;
  interactions: Array<{
    timestamp: number;
    messageType: string;
    outcome: UserOutcome;
    signal: number;
    context?: string;
  }>;
  personalizedThresholds: {
    procrastinationHigh: number;
    procrastinationMedium: number;
    activityTimeout: number;
  };
  modelMetrics: {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    lastUpdated: number;
  };
  createdAt: number;
}

export class BehavioralStorageService {
  private storageKey = STORAGE_KEYS.BEHAVIORAL_MODELS;
  private pendingWrites = new Map<string, StoredUserModel>();
  
  // Debounced write to prevent race conditions from rapid updates
  private debouncedWrite = debounce(() => {
    this.flushPendingWrites();
  }, SYNC_CONFIG.DEBOUNCE_DELAY);

  private flushPendingWrites(): void {
    if (this.pendingWrites.size === 0) return;

    try {
      const allModels = this.loadAllModels();
      
      // Apply all pending writes
      this.pendingWrites.forEach((model, userId) => {
        allModels[userId] = {
          ...model,
          modelMetrics: {
            ...model.modelMetrics,
            lastUpdated: Date.now()
          }
        };
      });

      // Single write operation
      const success = storageQuota.safeWrite(
        this.storageKey,
        JSON.stringify(allModels),
        localStorage,
        () => {
          logger.warn('[BehavioralStorage] Quota exceeded, trimming old data');
          this.trimOldModels(allModels);
        }
      );

      if (success) {
        this.pendingWrites.clear();
        logger.log('[BehavioralStorage] Flushed', this.pendingWrites.size, 'pending writes');
      } else {
        logger.error('[BehavioralStorage] Failed to flush pending writes');
      }
    } catch (error) {
      logger.error('[BehavioralStorage] Error flushing writes:', error);
    }
  }

  private trimOldModels(allModels: Record<string, StoredUserModel>): void {
    // Keep only models updated in last 90 days
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const trimmed: Record<string, StoredUserModel> = {};

    Object.entries(allModels).forEach(([userId, model]) => {
      if (model.modelMetrics.lastUpdated > cutoff) {
        trimmed[userId] = model;
      }
    });

    storageQuota.safeWrite(this.storageKey, JSON.stringify(trimmed));
  }

  /**
   * Flush pending writes immediately (useful before page unload)
   */
  flush(): void {
    this.debouncedWrite.flush();
  }

  saveUserModel(userId: string, model: StoredUserModel): void {
    // Queue the write instead of writing immediately (prevents race conditions)
    const compressed = {
      ...model,
      // Compress by removing old interactions
      interactions: model.interactions.length > LEARNING_CONSTANTS.MEMORY_LIMITS.INTERACTIONS_PER_USER
        ? model.interactions.slice(-LEARNING_CONSTANTS.MEMORY_LIMITS.INTERACTIONS_PER_USER)
        : model.interactions
    };
    
    this.pendingWrites.set(userId, compressed);
    
    // Trigger debounced flush (writes after 500ms of inactivity)
    this.debouncedWrite();
  }
  
  loadUserModel(userId: string): StoredUserModel | null {
    try {
      const allModels = this.loadAllModels();
      const model = allModels[userId];
      
      if (!model) return null;
      
      // Validate model structure
      if (!this.validateModel(model)) {
        logger.warn('[BehavioralStorage] Invalid model structure, resetting');
        return null;
      }
      
      // Clean old interactions
      const cutoff = Date.now() - (LEARNING_CONSTANTS.MEMORY_LIMITS.PATTERN_HISTORY_DAYS * 24 * 60 * 60 * 1000);
      model.interactions = model.interactions.filter(i => i.timestamp > cutoff);
      
      return model;
    } catch (error) {
      logger.warn('[BehavioralStorage] Load failed:', error);
      return null;
    }
  }
  
  private loadAllModels(): Record<string, StoredUserModel> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return {};
      return safeJsonParse<Record<string, StoredUserModel>>(stored, {});
    } catch {
      return {};
    }
  }
  
  private validateModel(model: unknown): model is StoredUserModel {
    return model !== null &&
           typeof model === 'object' &&
           'messageEffectiveness' in model &&
           typeof (model as StoredUserModel).messageEffectiveness === 'object' &&
           'interactions' in model &&
           Array.isArray((model as StoredUserModel).interactions) &&
           'personalizedThresholds' in model &&
           typeof (model as StoredUserModel).personalizedThresholds === 'object' &&
           'modelMetrics' in model &&
           typeof (model as StoredUserModel).modelMetrics === 'object';
  }
  
  getStorageStats(): { totalUsers: number; totalInteractions: number; storageSize: number } {
    const allModels = this.loadAllModels();
    const users = Object.keys(allModels);
    const totalInteractions = users.reduce((sum, userId) => 
      sum + (allModels[userId]?.interactions?.length || 0), 0);
    
    return {
      totalUsers: users.length,
      totalInteractions,
      storageSize: localStorage.getItem(this.storageKey)?.length || 0
    };
  }
  
  clearUserModel(userId: string): void {
    const allModels = this.loadAllModels();
    delete allModels[userId];
    localStorage.setItem(this.storageKey, JSON.stringify(allModels));
  }
}

export const behavioralStorage = new BehavioralStorageService();