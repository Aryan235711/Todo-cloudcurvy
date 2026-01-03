/**
 * Neural Nudge Health Monitor
 * Comprehensive metrics and health analysis for the neural nudge system
 */

import { abTestService } from './abTestService';
import { rateLimitService } from './rateLimitService';
import { userPreferencesService } from './userPreferencesService';
import { CALCULATION_WEIGHTS, PERFORMANCE_THRESHOLDS, RATE_LIMIT_THRESHOLDS, HEALTH_THRESHOLDS } from '../config/chartConstants';
import { 
  getNotificationStats, 
  getBehavioralInsights, 
  getMotivationStats, 
  getPredictiveInsights,
  getActiveExperiments 
} from './notificationService';

interface NudgeMetrics {
  totalSent: number;
  successRate: number;
  engagementRate: number;
  conversionRate: number;
  averageResponseTime: number;
  rateLimitHits: number;
  errorRate: number;
}

interface HealthScore {
  overall: number;
  effectiveness: number;
  reliability: number;
  userSatisfaction: number;
  systemHealth: number;
}

interface PerformanceMetrics {
  nudgeFrequency: number;
  optimalTimingAccuracy: number;
  contextualRelevance: number;
  behavioralPredictionAccuracy: number;
  abTestConvergence: number;
}

interface SystemHealth {
  rateLimitStatus: 'healthy' | 'warning' | 'critical';
  errorRate: number;
  responseTime: number;
  memoryUsage: number;
  activeExperiments: number;
}

type MetricValue = number | number[];

class NeuralNudgeHealthMonitor {
  private metrics: Map<string, MetricValue> = new Map();
  private healthHistory: Array<{ timestamp: number; score: HealthScore }> = [];
  
  constructor() {
    this.initializeMetrics();
  }

  // Helper methods for type-safe metric access
  private getNumberMetric(key: string): number {
    const value = this.metrics.get(key);
    return typeof value === 'number' ? value : 0;
  }

  private getArrayMetric(key: string): number[] {
    const value = this.metrics.get(key);
    return Array.isArray(value) ? value : [];
  }

  private initializeMetrics() {
    // Initialize with default values
    this.metrics.set('nudges_sent_24h', 0);
    this.metrics.set('nudges_successful_24h', 0);
    this.metrics.set('user_engagements_24h', 0);
    this.metrics.set('task_completions_24h', 0);
    this.metrics.set('response_times', []);
    this.metrics.set('error_count_24h', 0);
    this.metrics.set('rate_limit_hits_24h', 0);
  }

  // Core Health Assessment
  async assessOverallHealth(): Promise<HealthScore> {
    const effectiveness = await this.calculateEffectiveness();
    const reliability = await this.calculateReliability();
    const userSatisfaction = await this.calculateUserSatisfaction();
    const systemHealth = await this.calculateSystemHealth();
    
    const overall = (effectiveness + reliability + userSatisfaction + systemHealth) / 4;
    
    const healthScore: HealthScore = {
      overall: Math.round(overall * 100) / 100,
      effectiveness: Math.round(effectiveness * 100) / 100,
      reliability: Math.round(reliability * 100) / 100,
      userSatisfaction: Math.round(userSatisfaction * 100) / 100,
      systemHealth: Math.round(systemHealth * 100) / 100
    };

    // Store in history
    this.healthHistory.push({
      timestamp: Date.now(),
      score: healthScore
    });

    // Keep only last 100 entries
    if (this.healthHistory.length > 100) {
      this.healthHistory = this.healthHistory.slice(-100);
    }

    return healthScore;
  }

  private async calculateEffectiveness(): Promise<number> {
    const nudgesSent = this.getNumberMetric('nudges_sent_24h');
    const taskCompletions = this.getNumberMetric('task_completions_24h');
    const userEngagements = this.getNumberMetric('user_engagements_24h');
    
    if (nudgesSent === 0) return 0.5; // Neutral score if no data
    
    const conversionRate = taskCompletions / nudgesSent;
    const engagementRate = userEngagements / nudgesSent;
    
    // Behavioral insights accuracy
    const behavioralInsights = getBehavioralInsights();
    const predictionAccuracy = behavioralInsights.confidence;
    
    // Combine metrics (weighted)
    const effectiveness = (
      conversionRate * CALCULATION_WEIGHTS.EFFECTIVENESS.CONVERSION_RATE +
      engagementRate * CALCULATION_WEIGHTS.EFFECTIVENESS.ENGAGEMENT_RATE +
      predictionAccuracy * CALCULATION_WEIGHTS.EFFECTIVENESS.PREDICTION_ACCURACY
    );
    
    return Math.min(1, effectiveness);
  }

  private async calculateReliability(): Promise<number> {
    const nudgesSent = this.getNumberMetric('nudges_sent_24h');
    const nudgesSuccessful = this.getNumberMetric('nudges_successful_24h');
    const errorCount = this.getNumberMetric('error_count_24h');
    const rateLimitHits = this.getNumberMetric('rate_limit_hits_24h');
    
    if (nudgesSent === 0) return 1; // Perfect if no attempts
    
    const successRate = nudgesSuccessful / nudgesSent;
    const errorRate = errorCount / nudgesSent;
    const rateLimitRate = rateLimitHits / nudgesSent;
    
    // Calculate reliability score
    const reliability = successRate - (errorRate * 0.5) - (rateLimitRate * 0.3);
    
    return Math.max(0, Math.min(1, reliability));
  }

  private async calculateUserSatisfaction(): Promise<number> {
    const prefs = userPreferencesService.getPreferences();
    const motivationStats = getMotivationStats();
    const notificationStats = getNotificationStats();
    
    // User preference alignment
    const notificationsEnabled = prefs.notifications?.enabled ? 1 : 0;
    const hapticsEnabled = prefs.notifications?.enabled ? 1 : 0;
    
    // Engagement and streak metrics
    const engagementScore = notificationStats.engagementScore;
    const streakBonus = Math.min(1, motivationStats.streak / 10); // Normalize to 0-1
    
    // Quiet time respect
    const quietTimeRespect = notificationStats.isQuietTime ? 0.8 : 1; // Slight penalty if sending during quiet time
    
    const satisfaction = (
      (notificationsEnabled + hapticsEnabled) / 2 * CALCULATION_WEIGHTS.USER_SATISFACTION.PREFERENCE_ALIGNMENT +
      engagementScore * CALCULATION_WEIGHTS.USER_SATISFACTION.ENGAGEMENT_SCORE +
      streakBonus * CALCULATION_WEIGHTS.USER_SATISFACTION.STREAK_BONUS +
      quietTimeRespect * CALCULATION_WEIGHTS.USER_SATISFACTION.TIMING_RESPECT
    );
    
    return Math.min(1, satisfaction);
  }

  private async calculateSystemHealth(): Promise<number> {
    const rateLimitStatus = rateLimitService.getRateLimitStatus();
    const responseTimes = this.getArrayMetric('response_times');
    const errorRate = this.getNumberMetric('error_count_24h');
    const nudgesSent = this.getNumberMetric('nudges_sent_24h') || 1;
    
    // Rate limiting health (0-1)
    const rateLimitHealth = rateLimitStatus.notificationsInWindow / rateLimitStatus.maxNotifications;
    
    // Response time health (assume good < 100ms, bad > 1000ms)
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length 
      : 50;
    const responseTimeHealth = Math.max(0, Math.min(1, (PERFORMANCE_THRESHOLDS.RESPONSE_TIME.BAD_MS - avgResponseTime) / PERFORMANCE_THRESHOLDS.RESPONSE_TIME.BAD_MS));
    
    // Error rate health
    const errorRateHealth = Math.max(0, 1 - (errorRate / nudgesSent));
    
    const systemHealth = (
      rateLimitHealth * CALCULATION_WEIGHTS.SYSTEM_HEALTH.RATE_LIMIT +
      responseTimeHealth * CALCULATION_WEIGHTS.SYSTEM_HEALTH.RESPONSE_TIME +
      errorRateHealth * CALCULATION_WEIGHTS.SYSTEM_HEALTH.ERROR_RATE
    );
    
    return systemHealth;
  }

  // Performance Metrics
  getPerformanceMetrics(): PerformanceMetrics {
    const predictiveInsights = getPredictiveInsights();
    const behavioralInsights = getBehavioralInsights();
    const activeExperiments = getActiveExperiments();
    
    return {
      nudgeFrequency: this.calculateNudgeFrequency(),
      optimalTimingAccuracy: predictiveInsights.confidence,
      contextualRelevance: this.calculateContextualRelevance(),
      behavioralPredictionAccuracy: behavioralInsights.confidence,
      abTestConvergence: this.calculateABTestConvergence(Object.values(activeExperiments))
    };
  }

  private calculateNudgeFrequency(): number {
    const nudgesSent = this.getNumberMetric('nudges_sent_24h');
    const hoursInDay = 24;
    return nudgesSent / hoursInDay; // Nudges per hour
  }

  private calculateContextualRelevance(): number {
    const userEngagements = this.getNumberMetric('user_engagements_24h');
    const nudgesSent = this.getNumberMetric('nudges_sent_24h') || 1;
    return userEngagements / nudgesSent;
  }

  private calculateABTestConvergence(experiments: any[]): number {
    if (experiments.length === 0) return 1;
    
    // Calculate how well A/B tests are converging
    let totalConvergence = 0;
    experiments.forEach(exp => {
      const sampleSize = exp.metrics?.sample_size || 0;
      const confidence = Math.min(1, sampleSize / PERFORMANCE_THRESHOLDS.AB_TEST.CONFIDENCE_SAMPLE_SIZE);
      totalConvergence += confidence;
    });
    
    return totalConvergence / experiments.length;
  }

  // System Health Details
  getSystemHealthDetails(): SystemHealth {
    const rateLimitStatus = rateLimitService.getRateLimitStatus();
    const responseTimes = this.getArrayMetric('response_times');
    const errorCount = this.getNumberMetric('error_count_24h');
    const nudgesSent = this.getNumberMetric('nudges_sent_24h') || 1;
    const activeExperiments = getActiveExperiments();
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length 
      : 0;
    
    let rateLimitHealthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    const rateLimitUsage = rateLimitStatus.notificationsInWindow / rateLimitStatus.maxNotifications;
    
    if (rateLimitUsage > RATE_LIMIT_THRESHOLDS.CRITICAL) rateLimitHealthStatus = 'critical';
    else if (rateLimitUsage > RATE_LIMIT_THRESHOLDS.WARNING) rateLimitHealthStatus = 'warning';
    
    return {
      rateLimitStatus: rateLimitHealthStatus,
      errorRate: errorCount / nudgesSent,
      responseTime: avgResponseTime,
      memoryUsage: this.estimateMemoryUsage(),
      activeExperiments: Object.keys(activeExperiments).length
    };
  }

  private estimateMemoryUsage(): number {
    // Estimate memory usage based on stored data
    const historySize = this.healthHistory.length;
    const metricsSize = this.metrics.size;
    
    // Rough estimation in KB
    return (historySize * 0.1) + (metricsSize * 0.05);
  }

  // Metric Recording
  recordNudgeSent(success: boolean, responseTime?: number) {
    this.metrics.set('nudges_sent_24h', this.getNumberMetric('nudges_sent_24h') + 1);
    
    if (success) {
      this.metrics.set('nudges_successful_24h', this.getNumberMetric('nudges_successful_24h') + 1);
    } else {
      this.metrics.set('error_count_24h', this.getNumberMetric('error_count_24h') + 1);
    }
    
    if (responseTime) {
      const responseTimes = this.getArrayMetric('response_times');
      responseTimes.push(responseTime);
      // Keep only last 100 response times
      if (responseTimes.length > 100) {
        responseTimes.shift();
      }
      this.metrics.set('response_times', responseTimes);
    }
  }

  recordUserEngagement() {
    this.metrics.set('user_engagements_24h', this.getNumberMetric('user_engagements_24h') + 1);
  }

  recordTaskCompletion() {
    this.metrics.set('task_completions_24h', this.getNumberMetric('task_completions_24h') + 1);
  }

  recordRateLimitHit() {
    this.metrics.set('rate_limit_hits_24h', this.getNumberMetric('rate_limit_hits_24h') + 1);
  }

  // Health Trends
  getHealthTrends(hours: number = 24): Array<{ timestamp: number; score: HealthScore }> {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.healthHistory.filter(entry => entry.timestamp > cutoff);
  }

  // Recommendations
  getHealthRecommendations(): string[] {
    const recommendations: string[] = [];
    const systemHealth = this.getSystemHealthDetails();
    const performanceMetrics = this.getPerformanceMetrics();
    
    if (systemHealth.rateLimitStatus === 'critical') {
      recommendations.push('🚨 Rate limit usage critical - reduce nudge frequency');
    } else if (systemHealth.rateLimitStatus === 'warning') {
      recommendations.push('⚠️ Rate limit usage high - monitor nudge frequency');
    }
    
    if (systemHealth.errorRate > 0.1) {
      recommendations.push('🔧 High error rate detected - check notification permissions');
    }
    
    if (performanceMetrics.nudgeFrequency > 2) {
      recommendations.push('📉 Nudge frequency high - consider user fatigue');
    } else if (performanceMetrics.nudgeFrequency < 0.1) {
      recommendations.push('📈 Nudge frequency low - users may need more engagement');
    }
    
    if (performanceMetrics.behavioralPredictionAccuracy < 0.5) {
      recommendations.push('🎯 Low prediction accuracy - need more user data');
    }
    
    if (performanceMetrics.abTestConvergence < 0.7) {
      recommendations.push('🧪 A/B tests need more data for statistical significance');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Neural nudge system operating optimally');
    }
    
    return recommendations;
  }

  // Reset daily metrics (call this daily)
  resetDailyMetrics() {
    this.metrics.set('nudges_sent_24h', 0);
    this.metrics.set('nudges_successful_24h', 0);
    this.metrics.set('user_engagements_24h', 0);
    this.metrics.set('task_completions_24h', 0);
    this.metrics.set('error_count_24h', 0);
    this.metrics.set('rate_limit_hits_24h', 0);
    this.metrics.set('response_times', []);
  }

  // Export health report
  generateHealthReport() {
    const healthScore = this.assessOverallHealth();
    const performanceMetrics = this.getPerformanceMetrics();
    const systemHealth = this.getSystemHealthDetails();
    const recommendations = this.getHealthRecommendations();
    const trends = this.getHealthTrends();
    
    return {
      timestamp: new Date().toISOString(),
      healthScore,
      performanceMetrics,
      systemHealth,
      recommendations,
      trends: trends.slice(-10), // Last 10 data points
      summary: {
        status: 'pending',
        criticalIssues: recommendations.filter(r => r.includes('🚨')).length,
        warnings: recommendations.filter(r => r.includes('⚠️')).length
      }
    };
  }

  private getOverallStatus(healthScore: HealthScore): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (healthScore.overall >= HEALTH_THRESHOLDS.EXCELLENT) return 'excellent';
    if (healthScore.overall >= HEALTH_THRESHOLDS.GOOD) return 'good';
    if (healthScore.overall >= HEALTH_THRESHOLDS.FAIR) return 'fair';
    if (healthScore.overall >= HEALTH_THRESHOLDS.POOR) return 'poor';
    return 'critical';
  }
}

// Singleton instance
const neuralNudgeHealthMonitor = new NeuralNudgeHealthMonitor();

export { neuralNudgeHealthMonitor, type HealthScore, type PerformanceMetrics, type SystemHealth };