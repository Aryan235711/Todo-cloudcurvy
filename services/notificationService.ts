/**
 * Neural Nudge Service
 * Handles Haptic Feedback and System Notifications
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { abTestService } from './abTestService';
import { rateLimitService } from './rateLimitService';
import { userPreferencesService } from './userPreferencesService';
import { securityService } from './securityService';
import { enhancedLearning } from './enhancedLearningEngine';
import { LEARNING_CONSTANTS } from '../config/behavioralConstants';
import { logger } from '../utils/logger';
import { messageGenerationService, MessageContext } from './messageGenerationService';
import { 
  TIME_CONSTANTS, 
  PROCRASTINATION_THRESHOLDS, 
  NOTIFICATION_LIMITS,
  AB_TEST_VARIANTS,
  PROCRASTINATION_FACTORS,
  MESSAGE_PROBABILITIES
} from '../config/notificationConstants';

// Enhanced Intelligent Feedback Engine (replaced with persistent learning)
const intelligentFeedback = enhancedLearning;

const analytics = {
  track: (event: string, data: Record<string, unknown>) => {
    const sanitizedData = securityService.sanitizeAnalyticsData(data);
    logger.log(`[Analytics] ${securityService.sanitizeForLogging(event)}`, sanitizedData);
  }
};

interface UserPattern {
  activeHours: { start: number; end: number };
  quietHours: { start: number; end: number };
  lastActivity: number;
  engagementScore: number;
  completionStreak: number;
  lastCompletionTime: number;
  completionHistory: Array<{ time: number; hour: number; priority: string }>;
  productivityWindows: Array<{ start: number; end: number; score: number }>;
}

interface PredictiveInsight {
  optimalHour: number;
  confidence: number;
  reason: string;
}

interface NotificationContext {
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  taskCount?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  userState?: 'active' | 'away' | 'focused';
}

interface MotivationContext {
  streak: number;
  engagement: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  priority: 'low' | 'medium' | 'high';
  mood?: 'energetic' | 'focused' | 'tired' | 'stressed';
}

interface BehavioralInsight {
  procrastinationRisk: 'low' | 'medium' | 'high';
  interventionTiming: 'immediate' | 'gentle' | 'delayed';
  completionProbability: number;
  suggestedAction: string;
  confidence: number;
}

class SmartScheduler {
  private pattern: UserPattern = {
    activeHours: { start: 9, end: 17 },
    quietHours: { start: 22, end: 7 },
    lastActivity: Date.now(),
    engagementScore: 0.5,
    completionStreak: 0,
    lastCompletionTime: 0,
    completionHistory: [],
    productivityWindows: [
      { start: 9, end: 11, score: 0.8 },
      { start: 14, end: 16, score: 0.7 }
    ]
  };
  private productivityUpdateTimer: NodeJS.Timeout | number | null = null;
  private isUpdatingProductivity = false;

  updateActivity() {
    this.pattern.lastActivity = Date.now();
    this.pattern.engagementScore = Math.min(1, this.pattern.engagementScore + 0.1);
  }

  recordCompletion() {
    const now = Date.now();
    const hour = new Date(now).getHours();
    const daysSinceLastCompletion = (now - this.pattern.lastCompletionTime) / (24 * 60 * 60 * 1000);
    
    // Update completion history
    this.pattern.completionHistory.push({
      time: now,
      hour,
      priority: 'medium' // Will be updated by caller
    });
    
    // Keep only last 50 completions for analysis
    if (this.pattern.completionHistory.length > 50) {
      this.pattern.completionHistory = this.pattern.completionHistory.slice(-50);
    }
    
    // Debounced update to prevent race conditions
    this.updateProductivityWindowsDebounced();
    
    if (daysSinceLastCompletion <= 1.5) {
      this.pattern.completionStreak++;
    } else {
      this.pattern.completionStreak = 1;
    }
    
    this.pattern.lastCompletionTime = now;
    this.pattern.engagementScore = Math.min(1, this.pattern.engagementScore + 0.2);
  }

  isQuietTime(): boolean {
    const hour = new Date().getHours();
    const { start, end } = this.pattern.quietHours;
    return start > end ? (hour >= start || hour < end) : (hour >= start && hour < end);
  }

  getOptimalDelay(): number {
    if (this.isQuietTime()) return TIME_CONSTANTS.QUIET_TIME_DELAY;
    
    const timeSinceActivity = Date.now() - this.pattern.lastActivity;
    let baseDelay = TIME_CONSTANTS.BASE_DELAY;
    
    // A/B Test: Notification Frequency
    const frequencyVariant = abTestService.getVariant('notification_frequency');
    const validFrequencyVariants = ['high_frequency', 'low_frequency', 'adaptive'];
    
    if (frequencyVariant && !validFrequencyVariants.includes(frequencyVariant)) {
      logger.warn('[SmartScheduler] Invalid frequency variant:', frequencyVariant);
    }
    
    if (frequencyVariant === 'high_frequency') {
      baseDelay = TIME_CONSTANTS.HIGH_FREQUENCY_DELAY;
    } else if (frequencyVariant === 'low_frequency') {
      baseDelay = TIME_CONSTANTS.LOW_FREQUENCY_DELAY;
    }
    
    // Use predictive insights to adjust delay
    const prediction = this.getPredictiveInsight();
    if (prediction.confidence > 0.7) {
      const currentHour = new Date().getHours();
      const hoursUntilOptimal = prediction.optimalHour - currentHour;
      
      if (hoursUntilOptimal > 0 && hoursUntilOptimal <= 4) {
        return Math.min(hoursUntilOptimal * TIME_CONSTANTS.HOUR, TIME_CONSTANTS.MAX_PREDICTIVE_DELAY);
      }
    }
    
    if (timeSinceActivity < TIME_CONSTANTS.RECENT_ACTIVITY_THRESHOLD) return baseDelay * PROCRASTINATION_FACTORS.RECENT_ACTIVITY_MULTIPLIER;
    if (timeSinceActivity > TIME_CONSTANTS.AWAY_THRESHOLD) return baseDelay;
    
    return baseDelay * PROCRASTINATION_FACTORS.DEFAULT_MULTIPLIER;
  }

  generateContextualMessage(context: NotificationContext): { title: string; body: string } {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

    const messageContext: MessageContext = {
      streak: this.pattern.completionStreak,
      engagement: this.pattern.engagementScore,
      timeOfDay: timeOfDay as 'morning' | 'afternoon' | 'evening' | 'night',
      priority: context.priority || 'medium'
    };

    // 70% chance to use motivational message (delegated to service)
    const preferMotivational = Math.random() > 0.3;
    return messageGenerationService.generateMessage(messageContext, preferMotivational);
  }

  private updateProductivityWindowsDebounced() {
    // Clear previous timer
    if (this.productivityUpdateTimer !== null) {
      clearTimeout(this.productivityUpdateTimer as number);
    }
    
    // Debounce updates by 2 seconds to prevent race conditions
    this.productivityUpdateTimer = setTimeout(() => {
      this.updateProductivityWindows();
      this.productivityUpdateTimer = null;
    }, 2000);
  }

  private updateProductivityWindows() {
    // Prevent concurrent updates
    if (this.isUpdatingProductivity) return;
    this.isUpdatingProductivity = true;
    
    try {
      if (this.pattern.completionHistory.length < 5) return;
      
      const hourCounts = new Map<number, number>();
      
      // Count completions by hour
      this.pattern.completionHistory.forEach(completion => {
        const count = hourCounts.get(completion.hour) || 0;
        hourCounts.set(completion.hour, count + 1);
      });
      
      // Find top productivity hours
      const sortedHours = Array.from(hourCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      
      // Update productivity windows atomically
      this.pattern.productivityWindows = sortedHours.map(([hour, count]) => ({
        start: hour,
        end: hour + 1,
        score: Math.min(1, count / this.pattern.completionHistory.length * 5)
      }));
    } finally {
      this.isUpdatingProductivity = false;
    }
  }

  getPredictiveInsight(): PredictiveInsight {
    if (this.pattern.completionHistory.length < 3) {
      return { optimalHour: 10, confidence: 0.3, reason: 'Insufficient data' };
    }
    
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = currentDay === 0 || currentDay === 6;
    
    // Filter completions by weekday/weekend
    const relevantCompletions = this.pattern.completionHistory.filter(completion => {
      const completionDate = new Date(completion.time);
      const completionDay = completionDate.getDay();
      const wasWeekend = completionDay === 0 || completionDay === 6;
      return wasWeekend === isWeekend;
    });
    
    // Fall back to all completions if not enough data for current day type
    const recentCompletions = relevantCompletions.length >= 5 
      ? relevantCompletions.slice(-10) 
      : this.pattern.completionHistory.slice(-10);
    
    if (recentCompletions.length === 0) {
      return { optimalHour: currentHour + 1, confidence: 0.4, reason: 'No pattern data available' };
    }
    
    // Calculate hour frequency
    const hourFrequency = new Map<number, number>();
    recentCompletions.forEach(completion => {
      const count = hourFrequency.get(completion.hour) || 0;
      hourFrequency.set(completion.hour, count + 1);
    });
    
    // Find most common hour
    const sortedHours = Array.from(hourFrequency.entries())
      .sort(([,a], [,b]) => b - a);
    
    if (sortedHours.length === 0) {
      return { optimalHour: currentHour + 1, confidence: 0.4, reason: 'No clear pattern' };
    }
    
    const [mostCommonHour, frequency] = sortedHours[0];
    
    // Calculate statistical significance
    const sampleSize = recentCompletions.length;
    const expectedFrequency = sampleSize / 24; // Random distribution
    const observedFrequency = frequency;
    
    // Simple chi-square-like metric for significance
    const significance = Math.min(1, (observedFrequency - expectedFrequency) / expectedFrequency);
    
    // Outlier detection: remove hours with only 1 occurrence if we have enough data
    let filteredHour = mostCommonHour;
    if (sampleSize >= 10 && frequency === 1 && sortedHours.length > 1) {
      filteredHour = sortedHours[1][0]; // Use second most common
      logger.log('[Predictive] Filtered outlier hour, using second most common');
    }
    
    // Confidence based on frequency, sample size, and significance
    const frequencyConfidence = frequency / recentCompletions.length;
    const sampleConfidence = Math.min(1, sampleSize / 20); // More confident with more samples
    const significanceConfidence = Math.max(0.3, significance);
    const weekdayBonus = relevantCompletions.length >= 5 ? 0.1 : 0; // Bonus for matching day type
    
    const confidence = Math.min(0.95, 
      (frequencyConfidence * 0.5 + sampleConfidence * 0.3 + significanceConfidence * 0.2 + weekdayBonus)
    );
    
    const dayType = isWeekend ? 'weekend' : 'weekday';
    const reason = `${frequency}/${recentCompletions.length} completions at ${filteredHour}:00 (${dayType}, ${(confidence * 100).toFixed(0)}% confidence)`;
    
    return {
      optimalHour: filteredHour,
      confidence: Math.round(confidence * 100) / 100,
      reason
    };
  }

  analyzeBehavior(): BehavioralInsight {
    const now = Date.now();
    const timeSinceActivity = now - this.pattern.lastActivity;
    const daysSinceCompletion = (now - this.pattern.lastCompletionTime) / TIME_CONSTANTS.DAY;
    
    // Get personalized thresholds from enhanced learning
    const insights = enhancedLearning.getModelInsights();
    const thresholds = insights.personalizedThresholds || {
      procrastinationHigh: LEARNING_CONSTANTS.RISK_THRESHOLDS.PROCRASTINATION.HIGH_DAYS,
      procrastinationMedium: LEARNING_CONSTANTS.RISK_THRESHOLDS.PROCRASTINATION.MEDIUM_DAYS,
      activityTimeout: LEARNING_CONSTANTS.RISK_THRESHOLDS.PROCRASTINATION.ACTIVITY_HOURS
    };
    
    // Personalized procrastination risk assessment
    let procrastinationRisk: 'low' | 'medium' | 'high' = 'low';
    if (daysSinceCompletion > thresholds.procrastinationHigh) procrastinationRisk = 'high';
    else if (daysSinceCompletion > thresholds.procrastinationMedium || 
             timeSinceActivity > thresholds.activityTimeout * TIME_CONSTANTS.HOUR) procrastinationRisk = 'medium';
    
    // Intervention timing based on engagement and risk
    let interventionTiming: 'immediate' | 'gentle' | 'delayed' = 'gentle';
    if (procrastinationRisk === 'high' && this.pattern.engagementScore < 0.3) interventionTiming = 'immediate';
    else if (this.pattern.engagementScore > 0.7) interventionTiming = 'delayed';
    
    // Enhanced completion probability with model accuracy
    const baseProb = Math.max(0.1, this.pattern.engagementScore);
    const streakBonus = Math.min(0.3, this.pattern.completionStreak * 0.05);
    const riskPenalty = procrastinationRisk === 'high' ? 0.2 : procrastinationRisk === 'medium' ? 0.1 : 0;
    const modelAccuracy = insights.accuracy || 0.5;
    const completionProbability = Math.min(0.95, (baseProb + streakBonus - riskPenalty) * modelAccuracy);
    
    // Suggested action
    const actions = {
      high: 'Break task into smaller steps and start immediately',
      medium: 'Set a 15-minute timer and begin with the easiest part',
      low: 'Continue with current momentum'
    };
    
    return {
      procrastinationRisk,
      interventionTiming,
      completionProbability,
      suggestedAction: actions[procrastinationRisk],
      confidence: Math.min(0.9, modelAccuracy)
    };
  }

  generateMotivationalMessage(context: MotivationContext): { title: string; body: string } {
    // Delegate to centralized message generation service
    return messageGenerationService.generateMessage(context, true);
  }

  generateMotivationalNudge(context: NotificationContext, toneVariant?: string): { title: string; body: string } {
    // Input validation
    if (context && context.priority && !['low', 'medium', 'high'].includes(context.priority)) {
      logger.warn('[SmartScheduler] Invalid priority:', context.priority);
    }
    
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    
    const messageContext: MessageContext = {
      streak: this.pattern.completionStreak,
      engagement: this.pattern.engagementScore,
      timeOfDay: timeOfDay as 'morning' | 'afternoon' | 'evening' | 'night',
      priority: context?.priority || 'medium'
    };
    
    // Delegate to centralized service (always prefer motivational)
    return messageGenerationService.generateMessage(messageContext, true);
  }

  getBehavioralInsights(): BehavioralInsight {
    return this.analyzeBehavior();
  }
}

const scheduler = new SmartScheduler();

export const registerPushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== 'granted') {
      logger.warn('Push notification permission denied');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token: Token) => {
      analytics.track('push_token_registered', { token: securityService.sanitizeForLogging(token.value) });
      logger.log('Push registration success, token: ' + securityService.sanitizeForLogging(token.value));
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      analytics.track('push_registration_error', { error: securityService.sanitizeForLogging(String(error.error)) });
      logger.error('Push registration error: ', securityService.sanitizeForLogging(String(error.error)));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      analytics.track('push_received', { 
        title: securityService.sanitizeForLogging(notification.title || ''),
        body: securityService.sanitizeForLogging(notification.body || ''),
        id: notification.id 
      });
      logger.log('Push notification received: ', {
        title: securityService.sanitizeForLogging(notification.title || ''),
        body: securityService.sanitizeForLogging(notification.body || ''),
        id: notification.id
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      analytics.track('push_action', { 
        actionId: action.actionId,
        notificationId: action.notification.id 
      });
      logger.log('Push notification action performed: ', action.actionId);
    });

  } catch (error) {
    logger.warn('Push notification registration failed:', error);
    analytics.track('push_registration_failed', { error });
  }
};

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning', context?: 'taskCompletion' | 'navigation' | 'notifications') => {
  scheduler.updateActivity(); // Track user interaction
  
  // Check user preferences first
  const contextType = context || 'navigation';
  if (!userPreferencesService.shouldTriggerHaptic(contextType)) {
    return; // User has disabled haptic feedback for this context
  }
  
  // Use user's preferred intensity if available
  const userIntensity = userPreferencesService.getHapticIntensity();
  const actualType = type === 'light' || type === 'medium' || type === 'heavy' ? userIntensity : type;
  
  if (Capacitor.isNativePlatform()) {
    switch (actualType) {
      case 'light':
        void Haptics.impact({ style: ImpactStyle.Light });
        return;
      case 'medium':
        void Haptics.impact({ style: ImpactStyle.Medium });
        return;
      case 'heavy':
        void Haptics.impact({ style: ImpactStyle.Heavy });
        return;
      case 'success':
        void Haptics.notification({ type: NotificationType.Success });
        return;
      case 'warning':
        void Haptics.notification({ type: NotificationType.Warning });
        return;
    }
  }

  if (!('vibrate' in navigator)) return;

  switch (actualType) {
    case 'light':
      navigator.vibrate(10);
      break;
    case 'medium':
      navigator.vibrate(30);
      break;
    case 'heavy':
      navigator.vibrate(60);
      break;
    case 'success':
      navigator.vibrate([20, 40, 20]);
      break;
    case 'warning':
      navigator.vibrate([100, 50, 100]);
      break;
  }
  
  // Notify settings that haptic was triggered (for real-time sync)
  window.dispatchEvent(new CustomEvent('hapticTriggered', { 
    detail: { type: actualType, context: contextType } 
  }));
};

export const requestNotificationPermission = async () => {
  // Check user preferences first
  const prefs = userPreferencesService.getPreferences();
  if (!prefs.notifications.enabled) {
    return false; // User has disabled notifications
  }
  if (Capacitor.isNativePlatform()) {
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === 'granted';
  }

  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendNudge = async (
  title: string,
  body: string,
  opts?: { delayMs?: number; at?: Date; smart?: boolean; context?: NotificationContext }
): Promise<boolean> => {
  let delayMs = opts?.delayMs ?? 500;
  let finalTitle = title;
  let finalBody = body;
  
  if (opts?.smart !== false) {
    scheduler.updateActivity();
    const smartDelay = scheduler.getOptimalDelay();
    delayMs = Math.max(delayMs, smartDelay);
    
    // Generate contextual content if context provided
    if (opts?.context) {
      const contextualMessage = scheduler.generateContextualMessage(opts.context);
      finalTitle = contextualMessage.title;
      finalBody = contextualMessage.body;
      
      analytics.track('contextual_message_generated', {
        originalTitle: title,
        contextualTitle: finalTitle,
        priority: opts.context.priority,
        engagementScore: scheduler['pattern'].engagementScore,
        completionStreak: scheduler['pattern'].completionStreak
      });
    }
    
    analytics.track('smart_nudge_scheduled', {
      originalDelay: opts?.delayMs ?? 500,
      smartDelay,
      finalDelay: delayMs,
      isQuietTime: scheduler.isQuietTime()
    });
  }
  
  // Ensure scheduled time is always in the future (minimum 1 second)
  const now = Date.now();
  const targetTime = opts?.at?.getTime() ?? (now + delayMs);
  const scheduledAt = new Date(Math.max(targetTime, now + 1000));

  if (Capacitor.isNativePlatform()) {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return false;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000),
          title: finalTitle,
          body: finalBody,
          schedule: { at: scheduledAt },
        },
      ],
    });
    return true;
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') return false;

  try {
    if (delayMs > 0) {
      return new Promise(resolve => {
        window.setTimeout(() => {
          try {
            new Notification(securityService.sanitizeForHTML(finalTitle), { 
              body: securityService.sanitizeForHTML(finalBody), 
              icon: '/icon-192.png' 
            });
            resolve(true);
          } catch {
            resolve(false);
          }
        }, delayMs);
      });
    } else {
      new Notification(securityService.sanitizeForHTML(finalTitle), { 
        body: securityService.sanitizeForHTML(finalBody), 
        icon: '/icon-192.png' 
      });
      return true;
    }
  } catch {
    return false;
  }
};
export const setQuietHours = (start: number, end: number) => {
  scheduler['pattern'].quietHours = { start, end };
  analytics.track('quiet_hours_updated', { start, end });
};

export const getNotificationStats = () => ({
  isQuietTime: scheduler.isQuietTime() || userPreferencesService.isQuietTime(),
  nextOptimalDelay: scheduler.getOptimalDelay(),
  lastActivity: scheduler['pattern'].lastActivity,
  engagementScore: scheduler['pattern'].engagementScore,
  streak: scheduler['pattern'].completionStreak,
  rateLimitStatus: rateLimitService.getRateLimitStatus()
});
export const recordTaskCompletion = (priority: 'low' | 'medium' | 'high' = 'medium') => {
  scheduler.recordCompletion();
  
  // Update the priority in the most recent completion
  if (scheduler['pattern'].completionHistory.length > 0) {
    const lastIndex = scheduler['pattern'].completionHistory.length - 1;
    scheduler['pattern'].completionHistory[lastIndex].priority = priority;
  }
  
  // Track A/B test metrics for task completion
  abTestService.trackMetric('intervention_timing', 'task_completed', 1);
  abTestService.trackMetric('message_tone', 'task_completed', 1);
  abTestService.trackMetric('notification_frequency', 'task_completed', 1);
  abTestService.trackMetric('intervention_timing', 'engagement_score', scheduler['pattern'].engagementScore);
  
  analytics.track('task_completed', { 
    priority, 
    newStreak: scheduler['pattern'].completionStreak,
    engagementScore: scheduler['pattern'].engagementScore,
    predictiveInsight: scheduler.getPredictiveInsight(),
    activeExperiments: abTestService.getCurrentExperiments()
  });
};

export const sendContextualNudge = async (
  context: NotificationContext,
  opts?: { delayMs?: number; at?: Date }
): Promise<boolean> => {
  // Enterprise Rate Limiting Check
  if (!rateLimitService.canSendNotification('contextual')) {
    logger.log('[Neural Nudge] Contextual nudge blocked by rate limiting');
    rateLimitService.recordNotificationAttempt('contextual', false);
    return false;
  }
  
  try {
    const success = await sendNudge(
      securityService.sanitizeForHTML('Task Reminder'), 
      securityService.sanitizeForHTML('You have a pending task'), 
      {
        ...opts,
        smart: true,
        context
      }
    );
    
    rateLimitService.recordNotificationAttempt('contextual', success);
    return success;
  } catch (error) {
    logger.error(error);
    rateLimitService.recordNotificationAttempt('contextual', false);
    return false;
  }
};

export const getCompletionStats = () => ({
  streak: scheduler['pattern'].completionStreak,
  lastCompletion: scheduler['pattern'].lastCompletionTime,
  engagementScore: scheduler['pattern'].engagementScore
});
export const getPredictiveInsights = () => {
  const insight = scheduler.getPredictiveInsight();
  const windows = scheduler['pattern'].productivityWindows;
  const history = scheduler['pattern'].completionHistory;
  
  return {
    nextOptimalHour: insight.optimalHour,
    confidence: insight.confidence,
    reason: insight.reason,
    productivityWindows: windows,
    completionCount: history.length,
    averageCompletionHour: history.length > 0 
      ? Math.round(history.reduce((sum, c) => sum + c.hour, 0) / history.length)
      : null
  };
};

export const scheduleOptimalNotification = async (
  context: NotificationContext
): Promise<boolean> => {
  const insight = scheduler.getPredictiveInsight();
  const currentHour = new Date().getHours();
  
  let optimalDelay = 5 * 60 * 1000; // Default 5 minutes
  
  if (insight.confidence > 0.6) {
    const hoursUntilOptimal = insight.optimalHour - currentHour;
    if (hoursUntilOptimal > 0 && hoursUntilOptimal <= 6) {
      optimalDelay = hoursUntilOptimal * 60 * 60 * 1000;
    }
  }
  
  analytics.track('predictive_notification_scheduled', {
    currentHour,
    optimalHour: insight.optimalHour,
    confidence: insight.confidence,
    delayHours: optimalDelay / (60 * 60 * 1000)
  });
  
  return sendNudge('Optimal Time Alert', 'Perfect timing for productivity!', {
    delayMs: optimalDelay,
    smart: true,
    context
  });
};
export const generateMotivationalNudge = async (
  context?: { priority?: 'low' | 'medium' | 'high'; category?: string }
): Promise<boolean> => {
  // Enterprise Rate Limiting Check
  if (!rateLimitService.canSendNotification('motivational')) {
    logger.log('[Neural Nudge] Motivational nudge blocked by rate limiting');
    rateLimitService.recordNotificationAttempt('motivational', false);
    return false;
  }
  
  const motivationContext: MotivationContext = {
    streak: scheduler['pattern'].completionStreak,
    engagement: scheduler['pattern'].engagementScore,
    timeOfDay: (() => {
      const hour = new Date().getHours();
      return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    })() as 'morning' | 'afternoon' | 'evening' | 'night',
    priority: context?.priority || 'medium'
  };

  const message = scheduler.generateMotivationalMessage(motivationContext);
  
  try {
    const success = await sendNudge(message.title, message.body, {
      smart: true,
      context: { priority: context?.priority, category: context?.category }
    });
    
    rateLimitService.recordNotificationAttempt('motivational', success);
    
    if (success) {
      analytics.track('motivational_nudge_generated', {
        streak: motivationContext.streak,
        engagement: motivationContext.engagement,
        timeOfDay: motivationContext.timeOfDay,
        priority: motivationContext.priority,
        title: message.title
      });
    }

    return success;
  } catch (error) {
    // Handle gracefully without crashing
    logger.error('[Neural Nudge] Motivational nudge failed:', error);
    rateLimitService.recordNotificationAttempt('motivational', false);
    analytics.track('motivational_nudge_error', {
      error: String(error),
      context: motivationContext
    });
    return false;
  }
};

export const getMotivationStats = () => ({
  streak: scheduler['pattern'].completionStreak,
  engagement: scheduler['pattern'].engagementScore,
  motivationLevel: scheduler['pattern'].completionStreak > 5 ? 'high' : 
                   scheduler['pattern'].completionStreak > 2 ? 'medium' : 'building',
  nextMotivationType: scheduler['pattern'].engagementScore > 0.8 ? 'celebration' :
                      scheduler['pattern'].engagementScore < 0.4 ? 'encouragement' : 'momentum'
});

export const getBehavioralInsights = () => {
  const insight = scheduler.analyzeBehavior();
  const predictive = scheduler.getPredictiveInsight();
  
  return {
    procrastinationRisk: insight.procrastinationRisk,
    interventionTiming: insight.interventionTiming,
    completionProbability: insight.completionProbability,
    suggestedAction: insight.suggestedAction,
    confidence: insight.confidence,
    nextOptimalHour: predictive.optimalHour,
    behaviorPattern: predictive.reason,
    activeExperiments: abTestService.getCurrentExperiments()
  };
};

export const sendBehavioralIntervention = async (
  context?: NotificationContext
): Promise<boolean> => {
  // Input validation
  if (context) {
    if (context.priority && !['low', 'medium', 'high'].includes(context.priority)) {
      logger.warn('[Neural Nudge] Invalid priority in context:', context.priority);
      context.priority = 'medium'; // Fallback to default
    }
    if (context.category && typeof context.category !== 'string') {
      logger.warn('[Neural Nudge] Invalid category type:', typeof context.category);
      context.category = undefined;
    }
  }
  
  const behavioral = scheduler.analyzeBehavior();
  
  if (behavioral.procrastinationRisk === 'low') {
    return false; // No intervention needed
  }
  
  // FIXED: Enterprise Rate Limiting Check with proper error handling
  if (!rateLimitService.canSendNotification('intervention')) {
    const status = rateLimitService.getRateLimitStatus();
    logger.log(`[Neural Nudge] Intervention blocked by rate limiting - ${Math.round(status.timeUntilNext / 1000)}s remaining`);
    rateLimitService.recordNotificationAttempt('intervention', false);
    return false;
  }
  
  // A/B Test: Intervention Timing Strategy
  const timingVariant = abTestService.getVariant('intervention_timing');
  const validTimingVariants = ['aggressive', 'gentle', 'adaptive'];
  
  if (timingVariant && !validTimingVariants.includes(timingVariant)) {
    logger.warn('[Neural Nudge] Invalid timing variant:', timingVariant);
  }
  
  let actualTiming = behavioral.interventionTiming;
  
  if (timingVariant === 'aggressive') {
    actualTiming = 'immediate'; // Always immediate for aggressive variant
  } else if (timingVariant === 'gentle') {
    actualTiming = behavioral.procrastinationRisk === 'high' ? 'gentle' : 'delayed';
  }
  // 'adaptive' uses the original behavioral.interventionTiming
  
  const messages = {
    high: {
      immediate: ['🚨 Break the cycle', 'Small action beats perfect planning'],
      gentle: ['🎯 Gentle nudge', 'One tiny step forward?'],
      delayed: ['⏰ When you\'re ready', 'No pressure, just progress']
    },
    medium: {
      immediate: ['💪 Time to act', 'Momentum starts with one move'],
      gentle: ['🌟 Friendly reminder', 'Ready to make progress?'],
      delayed: ['🎈 Easy opportunity', 'Perfect time for a quick win']
    }
  };
  
  const riskLevel = behavioral.procrastinationRisk === 'high' ? 'high' : 'medium';
  const [title, body] = messages[riskLevel][actualTiming];
  
  const delay = actualTiming === 'immediate' ? 0 : actualTiming === 'gentle' ? 2 * 60 * 1000 : 10 * 60 * 1000;
  
  try {
    const success = await sendNudge(title, body, {
      delayMs: delay,
      smart: false, // Override smart scheduling for interventions
      context: { ...context, priority: 'high' }
    });
    
    // Record rate limiting attempt
    rateLimitService.recordNotificationAttempt('intervention', success);
    
    if (success) {
      // Track A/B test metrics only on successful send
      abTestService.trackMetric('intervention_timing', 'intervention_sent', 1);
      abTestService.trackMetric('message_tone', 'intervention_sent', 1);
      abTestService.trackMetric('notification_frequency', 'intervention_sent', 1);
    }
    
    analytics.track('behavioral_intervention', {
      risk: behavioral.procrastinationRisk,
      timing: actualTiming,
      originalTiming: behavioral.interventionTiming,
      timingVariant,
      probability: behavioral.completionProbability,
      confidence: behavioral.confidence,
      success
    });
    
    return success;
  } catch (error) {
    // Don't re-throw - handle gracefully
    logger.error('[Neural Nudge] Behavioral intervention failed:', error);
    rateLimitService.recordNotificationAttempt('intervention', false);
    analytics.track('behavioral_intervention_error', {
      error: String(error),
      risk: behavioral.procrastinationRisk
    });
    return false; // Return false instead of crashing
  }
};



export const getPredictiveInsight = () => {
  return scheduler.getPredictiveInsight();
};

export const getActiveExperiments = () => {
  return abTestService.getCurrentExperiments();
};

// Enhanced intelligent feedback functions with persistent learning
export const recordUserFeedback = (userId: string, messageType: string, outcome: { completed: boolean; engaged: boolean; ignored: boolean; frustrated: boolean }, context?: string) => {
  enhancedLearning.processUserFeedback(messageType, outcome, context);
};

export const getIntelligentInsights = (userId: string = 'default') => {
  const insights = enhancedLearning.getModelInsights();
  return {
    messageEffectiveness: insights.messageEffectiveness,
    totalInteractions: insights.totalInteractions,
    modelAccuracy: insights.accuracy,
    personalizedThresholds: insights.personalizedThresholds,
    lastUpdated: insights.lastUpdated
  };
};