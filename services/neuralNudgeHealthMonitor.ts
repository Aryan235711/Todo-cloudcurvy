/**
 * Neural Nudge Health Monitor
 * Comprehensive metrics and health analysis for the neural nudge system
 */

import { abTestService } from './abTestService';
import { rateLimitService } from './rateLimitService';
import { userPreferencesService } from './userPreferencesService';
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

class NeuralNudgeHealthMonitor {
  private metrics: Map<string, any> = new Map();
  private healthHistory: Array<{ timestamp: number; score: HealthScore }> = [];
  
  constructor() {
    this.initializeMetrics();
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
    const nudgesSent = this.metrics.get('nudges_sent_24h') || 0;
    const taskCompletions = this.metrics.get('task_completions_24h') || 0;
    const userEngagements = this.metrics.get('user_engagements_24h') || 0;
    
    if (nudgesSent === 0) return 0.5; // Neutral score if no data
    
    const conversionRate = taskCompletions / nudgesSent;
    const engagementRate = userEngagements / nudgesSent;
    
    // Behavioral insights accuracy
    const behavioralInsights = getBehavioralInsights();
    const predictionAccuracy = behavioralInsights.confidence;
    
    // Combine metrics (weighted)
    const effectiveness = (
      conversionRate * 0.4 +           // 40% weight on actual completions
      engagementRate * 0.3 +           // 30% weight on user engagement
      predictionAccuracy * 0.3         // 30% weight on prediction accuracy
    );
    
    return Math.min(1, effectiveness);
  }

  private async calculateReliability(): Promise<number> {
    const nudgesSent = this.metrics.get('nudges_sent_24h') || 0;
    const nudgesSuccessful = this.metrics.get('nudges_successful_24h') || 0;
    const errorCount = this.metrics.get('error_count_24h') || 0;
    const rateLimitHits = this.metrics.get('rate_limit_hits_24h') || 0;
    
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
    const hapticsEnabled = prefs.haptics?.enabled ? 1 : 0;
    
    // Engagement and streak metrics
    const engagementScore = notificationStats.engagementScore;
    const streakBonus = Math.min(1, motivationStats.streak / 10); // Normalize to 0-1
    
    // Quiet time respect
    const quietTimeRespect = notificationStats.isQuietTime ? 0.8 : 1; // Slight penalty if sending during quiet time
    
    const satisfaction = (
      (notificationsEnabled + hapticsEnabled) / 2 * 0.3 +  // 30% preference alignment
      engagementScore * 0.4 +                               // 40% engagement
      streakBonus * 0.2 +                                   // 20% streak performance
      quietTimeRespect * 0.1                                // 10% timing respect
    );
    
    return Math.min(1, satisfaction);
  }

  private async calculateSystemHealth(): Promise<number> {
    const rateLimitStatus = rateLimitService.getRateLimitStatus();
    const responseTimes = this.metrics.get('response_times') || [];
    const errorRate = this.metrics.get('error_count_24h') || 0;
    const nudgesSent = this.metrics.get('nudges_sent_24h') || 1;
    
    // Rate limiting health (0-1)
    const rateLimitHealth = rateLimitStatus.remaining / rateLimitStatus.limit;
    
    // Response time health (assume good < 100ms, bad > 1000ms)
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length 
      : 50;
    const responseTimeHealth = Math.max(0, Math.min(1, (1000 - avgResponseTime) / 1000));
    
    // Error rate health
    const errorRateHealth = Math.max(0, 1 - (errorRate / nudgesSent));
    
    const systemHealth = (
      rateLimitHealth * 0.4 +      // 40% rate limiting
      responseTimeHealth * 0.3 +   // 30% response time
      errorRateHealth * 0.3        // 30% error rate
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
      abTestConvergence: this.calculateABTestConvergence(activeExperiments)
    };
  }

  private calculateNudgeFrequency(): number {
    const nudgesSent = this.metrics.get('nudges_sent_24h') || 0;
    const hoursInDay = 24;
    return nudgesSent / hoursInDay; // Nudges per hour
  }

  private calculateContextualRelevance(): number {
    const userEngagements = this.metrics.get('user_engagements_24h') || 0;
    const nudgesSent = this.metrics.get('nudges_sent_24h') || 1;
    return userEngagements / nudgesSent;
  }

  private calculateABTestConvergence(experiments: any[]): number {
    if (experiments.length === 0) return 1;
    
    // Calculate how well A/B tests are converging
    let totalConvergence = 0;
    experiments.forEach(exp => {
      const sampleSize = exp.metrics?.sample_size || 0;
      const confidence = Math.min(1, sampleSize / 100); // Assume 100 samples for good confidence
      totalConvergence += confidence;
    });
    
    return totalConvergence / experiments.length;
  }

  // System Health Details
  getSystemHealthDetails(): SystemHealth {
    const rateLimitStatus = rateLimitService.getRateLimitStatus();
    const responseTimes = this.metrics.get('response_times') || [];
    const errorCount = this.metrics.get('error_count_24h') || 0;
    const nudgesSent = this.metrics.get('nudges_sent_24h') || 1;
    const activeExperiments = getActiveExperiments();
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length 
      : 0;
    
    let rateLimitHealthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    const rateLimitUsage = 1 - (rateLimitStatus.remaining / rateLimitStatus.limit);
    
    if (rateLimitUsage > 0.9) rateLimitHealthStatus = 'critical';
    else if (rateLimitUsage > 0.7) rateLimitHealthStatus = 'warning';
    
    return {
      rateLimitStatus: rateLimitHealthStatus,
      errorRate: errorCount / nudgesSent,
      responseTime: avgResponseTime,
      memoryUsage: this.estimateMemoryUsage(),
      activeExperiments: activeExperiments.length
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
    this.metrics.set('nudges_sent_24h', (this.metrics.get('nudges_sent_24h') || 0) + 1);
    
    if (success) {
      this.metrics.set('nudges_successful_24h', (this.metrics.get('nudges_successful_24h') || 0) + 1);
    } else {
      this.metrics.set('error_count_24h', (this.metrics.get('error_count_24h') || 0) + 1);
    }
    
    if (responseTime) {
      const responseTimes = this.metrics.get('response_times') || [];
      responseTimes.push(responseTime);
      // Keep only last 100 response times
      if (responseTimes.length > 100) {
        responseTimes.shift();
      }
      this.metrics.set('response_times', responseTimes);
    }
  }

  recordUserEngagement() {
    this.metrics.set('user_engagements_24h', (this.metrics.get('user_engagements_24h') || 0) + 1);
  }

  recordTaskCompletion() {
    this.metrics.set('task_completions_24h', (this.metrics.get('task_completions_24h') || 0) + 1);
  }

  recordRateLimitHit() {
    this.metrics.set('rate_limit_hits_24h', (this.metrics.get('rate_limit_hits_24h') || 0) + 1);
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
        status: healthScore.then ? 'pending' : this.getOverallStatus(healthScore),
        criticalIssues: recommendations.filter(r => r.includes('🚨')).length,
        warnings: recommendations.filter(r => r.includes('⚠️')).length
      }
    };
  }

  private getOverallStatus(healthScore: HealthScore): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (healthScore.overall >= 0.9) return 'excellent';
    if (healthScore.overall >= 0.75) return 'good';
    if (healthScore.overall >= 0.6) return 'fair';
    if (healthScore.overall >= 0.4) return 'poor';
    return 'critical';
  }
}

// Singleton instance
const neuralNudgeHealthMonitor = new NeuralNudgeHealthMonitor();

export { neuralNudgeHealthMonitor, type HealthScore, type PerformanceMetrics, type SystemHealth };