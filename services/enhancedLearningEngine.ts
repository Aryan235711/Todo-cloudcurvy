// Enhanced Intelligent Feedback Engine
import { LEARNING_CONSTANTS } from '../config/behavioralConstants';
import { behavioralStorage } from './behavioralStorage';
import { logger } from '../utils/logger';

interface UserOutcome {
  completed: boolean;
  engaged: boolean;
  ignored: boolean;
  frustrated: boolean;
}

interface PredictionResult {
  prediction: number;
  confidence: number;
  reasoning: string[];
}

interface PredictionContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  priority: 'low' | 'medium' | 'high';
  streak: number;
  engagement: number;
}

interface PersonalizedThresholds {
  procrastinationHigh: number;
  procrastinationMedium: number;
  activityTimeout: number;
}

interface ModelMetrics {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  lastUpdated: number;
}

interface UserModel {
  messageEffectiveness: Record<string, number>;
  interactions: Array<{
    timestamp: number;
    messageType: string;
    outcome: UserOutcome;
    signal: number;
    context?: string;
  }>;
  personalizedThresholds: PersonalizedThresholds;
  modelMetrics: ModelMetrics;
  createdAt: number;
}

interface ModelInsights {
  accuracy: number;
  totalInteractions: number;
  personalizedThresholds: PersonalizedThresholds;
  messageEffectiveness: Record<string, number>;
  lastUpdated: number;
}

export class EnhancedLearningEngine {
  private userId: string = 'default';
  
  constructor(userId: string = 'default') {
    this.userId = userId;
  }
  
  processUserFeedback(messageType: string, outcome: UserOutcome, context?: string): void {
    // Input validation
    if (!messageType || typeof messageType !== 'string' || messageType.trim().length === 0) {
      logger.warn('[EnhancedLearning] Invalid messageType:', messageType);
      return;
    }
    
    if (!outcome || typeof outcome !== 'object') {
      logger.warn('[EnhancedLearning] Invalid outcome:', outcome);
      return;
    }
    
    // Sanitize messageType
    const validMessageTypes = ['motivational', 'gentle', 'urgent', 'celebration', 'encouraging', 'neutral'];
    const sanitizedMessageType = messageType.trim().toLowerCase();
    
    if (!validMessageTypes.includes(sanitizedMessageType) && !sanitizedMessageType.startsWith('custom_')) {
      logger.warn('[EnhancedLearning] Unknown messageType, allowing as custom:', sanitizedMessageType);
    }
    
    const model = this.getUserModel();
    const signal = this.calculateAdaptiveSignal(outcome, context);
    const learningRate = this.calculateAdaptiveLearningRate(model);
    
    // Update message effectiveness with adaptive learning
    if (!model.messageEffectiveness[sanitizedMessageType]) {
      model.messageEffectiveness[sanitizedMessageType] = 0.5;
    }
    
    const currentEffectiveness = model.messageEffectiveness[sanitizedMessageType];
    const newEffectiveness = currentEffectiveness + (signal * learningRate);
    model.messageEffectiveness[sanitizedMessageType] = Math.max(0, Math.min(1, newEffectiveness));
    
    // Store enhanced interaction data
    model.interactions.push({
      timestamp: Date.now(),
      messageType: sanitizedMessageType,
      outcome,
      signal,
      context: context || 'general'
    });
    
    // Update personalized thresholds based on patterns
    this.updatePersonalizedThresholds(model);
    
    // Update model accuracy metrics
    this.updateModelMetrics(model, outcome);
    
    // Save to persistent storage
    behavioralStorage.saveUserModel(this.userId, model);
  }
  
  private calculateAdaptiveSignal(outcome: UserOutcome, context?: string): number {
    let signal = 0;
    const weights = LEARNING_CONSTANTS.FEEDBACK_WEIGHTS;
    
    if (outcome.completed) signal += weights.COMPLETED;
    if (outcome.engaged) signal += weights.ENGAGED;
    if (outcome.ignored) signal += weights.IGNORED;
    if (outcome.frustrated) signal += weights.FRUSTRATED;
    
    // Context-aware adjustment
    if (context) {
      const contextMultiplier = this.getContextMultiplier(context);
      signal *= (1 + contextMultiplier * weights.CONTEXT_MULTIPLIER);
    }
    
    return Math.max(-1, Math.min(1, signal));
  }
  
  private calculateAdaptiveLearningRate(model: UserModel): number {
    const baseRate = LEARNING_CONSTANTS.ADAPTIVE_LEARNING.BASE_RATE;
    const accuracy = model.modelMetrics.accuracy;
    const sampleCount = model.interactions.length;
    
    // Adapt learning rate based on model performance
    let adaptiveRate = baseRate;
    
    if (accuracy < 0.5 && sampleCount > 10) {
      // Low accuracy - increase learning rate
      adaptiveRate *= (1 + LEARNING_CONSTANTS.ADAPTIVE_LEARNING.ADAPTATION_FACTOR);
    } else if (accuracy > 0.8 && sampleCount > 20) {
      // High accuracy - decrease learning rate for stability
      adaptiveRate *= (1 - LEARNING_CONSTANTS.ADAPTIVE_LEARNING.ADAPTATION_FACTOR);
    }
    
    return Math.max(
      LEARNING_CONSTANTS.ADAPTIVE_LEARNING.MIN_RATE,
      Math.min(LEARNING_CONSTANTS.ADAPTIVE_LEARNING.MAX_RATE, adaptiveRate)
    );
  }
  
  private updatePersonalizedThresholds(model: UserModel): void {
    const recentInteractions = model.interactions.slice(-20);
    if (recentInteractions.length < LEARNING_CONSTANTS.MEMORY_LIMITS.MIN_SAMPLES_FOR_PREDICTION) return;
    
    // Analyze user's personal patterns for procrastination
    const frustrationEvents = recentInteractions.filter(i => i.outcome.frustrated);
    const engagementEvents = recentInteractions.filter(i => i.outcome.engaged);
    
    if (frustrationEvents.length > engagementEvents.length) {
      // User gets frustrated easily - be more gentle
      model.personalizedThresholds.procrastinationHigh *= 1.1;
      model.personalizedThresholds.activityTimeout *= 1.2;
    } else if (engagementEvents.length > frustrationEvents.length * 2) {
      // User responds well - can be more proactive
      model.personalizedThresholds.procrastinationHigh *= 0.9;
      model.personalizedThresholds.activityTimeout *= 0.8;
    }
    
    // Keep thresholds within reasonable bounds
    model.personalizedThresholds.procrastinationHigh = Math.max(0.5, Math.min(5.0, model.personalizedThresholds.procrastinationHigh));
    model.personalizedThresholds.activityTimeout = Math.max(1.0, Math.min(8.0, model.personalizedThresholds.activityTimeout));
  }
  
  private updateModelMetrics(model: UserModel, outcome: UserOutcome): void {
    model.modelMetrics.totalPredictions++;
    
    // Simple accuracy tracking - if user engaged or completed, prediction was good
    if (outcome.engaged || outcome.completed) {
      model.modelMetrics.correctPredictions++;
    }
    
    model.modelMetrics.accuracy = model.modelMetrics.correctPredictions / model.modelMetrics.totalPredictions;
  }
  
  predictOptimalMessageType(context: PredictionContext): PredictionResult {
    // Input validation
    if (!context || typeof context !== 'object') {
      logger.warn('[EnhancedLearning] Invalid context:', context);
      return {
        prediction: 0.5,
        confidence: 0.3,
        reasoning: ['Invalid context provided, using defaults']
      };
    }
    
    // Validate context fields
    const validTimes = ['morning', 'afternoon', 'evening', 'night'];
    const validPriorities = ['low', 'medium', 'high'];
    
    if (!validTimes.includes(context.timeOfDay)) {
      logger.warn('[EnhancedLearning] Invalid timeOfDay:', context.timeOfDay);
    }
    
    if (!validPriorities.includes(context.priority)) {
      logger.warn('[EnhancedLearning] Invalid priority:', context.priority);
    }
    
    if (typeof context.streak !== 'number' || context.streak < 0) {
      logger.warn('[EnhancedLearning] Invalid streak:', context.streak);
    }
    
    if (typeof context.engagement !== 'number' || context.engagement < 0 || context.engagement > 1) {
      logger.warn('[EnhancedLearning] Invalid engagement (should be 0-1):', context.engagement);
    }
    
    const model = this.getUserModel();
    const messageTypes = ['motivational', 'gentle', 'urgent', 'celebration'];
    
    let bestType = 'motivational';
    let bestScore = 0.5;
    const reasoning: string[] = [];
    
    // Enhanced prediction with context awareness
    messageTypes.forEach(type => {
      let effectiveness = model.messageEffectiveness[type] || 0.5;
      
      // Context-based adjustments
      if (context.timeOfDay === 'morning' && type === 'motivational') effectiveness *= 1.2;
      if (context.priority === 'high' && type === 'urgent') effectiveness *= 1.1;
      if (context.streak > 3 && type === 'celebration') effectiveness *= 1.3;
      
      if (effectiveness > bestScore) {
        bestScore = effectiveness;
        bestType = type;
        reasoning.push(`${type} selected (${(effectiveness * 100).toFixed(1)}% effective)`);
      }
    });
    
    // Calculate confidence based on sample size and variance
    const sampleCount = model.interactions.filter(i => i.messageType === bestType).length;
    const confidence = Math.min(0.95, sampleCount / 20) * bestScore;
    
    return {
      prediction: bestScore,
      confidence,
      reasoning
    };
  }
  
  private getUserModel(): UserModel {
    let model = behavioralStorage.loadUserModel(this.userId);
    
    if (!model) {
      model = {
        messageEffectiveness: {},
        interactions: [],
        personalizedThresholds: {
          procrastinationHigh: LEARNING_CONSTANTS.RISK_THRESHOLDS.PROCRASTINATION.HIGH_DAYS,
          procrastinationMedium: LEARNING_CONSTANTS.RISK_THRESHOLDS.PROCRASTINATION.MEDIUM_DAYS,
          activityTimeout: LEARNING_CONSTANTS.RISK_THRESHOLDS.PROCRASTINATION.ACTIVITY_HOURS
        },
        modelMetrics: {
          totalPredictions: 0,
          correctPredictions: 0,
          accuracy: 0.5,
          lastUpdated: Date.now()
        },
        createdAt: Date.now()
      };
    }
    
    return model;
  }
  
  private getContextMultiplier(context: string): number {
    const contextMap: Record<string, number> = {
      'high_priority': 0.3,
      'morning': 0.2,
      'evening': -0.1,
      'streak_active': 0.25,
      'first_task': 0.15
    };
    return contextMap[context] || 0;
  }
  
  getModelInsights(): ModelInsights {
    const model = this.getUserModel();
    return {
      accuracy: model.modelMetrics.accuracy,
      totalInteractions: model.interactions.length,
      personalizedThresholds: model.personalizedThresholds,
      messageEffectiveness: model.messageEffectiveness,
      lastUpdated: model.modelMetrics.lastUpdated
    };
  }
}

export const enhancedLearning = new EnhancedLearningEngine();