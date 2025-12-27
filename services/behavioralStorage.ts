// Enhanced Behavioral Storage Service
import { LEARNING_CONSTANTS } from '../config/behavioralConstants';

interface StoredUserModel {
  messageEffectiveness: Record<string, number>;
  interactions: Array<{
    timestamp: number;
    messageType: string;
    outcome: any;
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
  private storageKey = 'loop_behavioral_models';
  
  saveUserModel(userId: string, model: StoredUserModel): void {
    try {
      const allModels = this.loadAllModels();
      allModels[userId] = {
        ...model,
        modelMetrics: {
          ...model.modelMetrics,
          lastUpdated: Date.now()
        }
      };
      
      // Compress by removing old interactions
      if (allModels[userId].interactions.length > LEARNING_CONSTANTS.MEMORY_LIMITS.INTERACTIONS_PER_USER) {
        allModels[userId].interactions = allModels[userId].interactions
          .slice(-LEARNING_CONSTANTS.MEMORY_LIMITS.INTERACTIONS_PER_USER);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(allModels));
    } catch (error) {
      console.warn('[BehavioralStorage] Save failed:', error);
    }
  }
  
  loadUserModel(userId: string): StoredUserModel | null {
    try {
      const allModels = this.loadAllModels();
      const model = allModels[userId];
      
      if (!model) return null;
      
      // Validate model structure
      if (!this.validateModel(model)) {
        console.warn('[BehavioralStorage] Invalid model structure, resetting');
        return null;
      }
      
      // Clean old interactions
      const cutoff = Date.now() - (LEARNING_CONSTANTS.MEMORY_LIMITS.PATTERN_HISTORY_DAYS * 24 * 60 * 60 * 1000);
      model.interactions = model.interactions.filter(i => i.timestamp > cutoff);
      
      return model;
    } catch (error) {
      console.warn('[BehavioralStorage] Load failed:', error);
      return null;
    }
  }
  
  private loadAllModels(): Record<string, StoredUserModel> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
  
  private validateModel(model: any): boolean {
    return model &&
           typeof model.messageEffectiveness === 'object' &&
           Array.isArray(model.interactions) &&
           typeof model.personalizedThresholds === 'object' &&
           typeof model.modelMetrics === 'object';
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