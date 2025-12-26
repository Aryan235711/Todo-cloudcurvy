import fs from 'fs';
import path from 'path';

// Mock the required services for testing
const mockServices = {
  abTestService: {
    getVariant: (test) => 'control',
    trackMetric: (test, metric, value) => console.log(`Tracking ${test}:${metric} = ${value}`),
    getCurrentExperiments: () => [
      { name: 'intervention_timing', variant: 'adaptive', metrics: { sample_size: 150 } },
      { name: 'message_tone', variant: 'encouraging', metrics: { sample_size: 200 } },
      { name: 'notification_frequency', variant: 'medium', metrics: { sample_size: 180 } }
    ]
  },
  
  rateLimitService: {
    canSendNotification: (type) => true,
    recordNotificationAttempt: (type, success) => {},
    getRateLimitStatus: () => ({ remaining: 850, limit: 1000, resetTime: Date.now() + 3600000 })
  },
  
  userPreferencesService: {
    shouldTriggerHaptic: (context) => true,
    getHapticIntensity: () => 'medium',
    getPreferences: () => ({
      notifications: { enabled: true },
      haptics: { enabled: true }
    }),
    isQuietTime: () => false
  },
  
  securityService: {
    sanitizeAnalyticsData: (data) => data,
    sanitizeForLogging: (str) => str,
    sanitizeForHTML: (str) => str
  }
};

// Mock notification service functions
const mockNotificationService = {
  getNotificationStats: () => ({
    isQuietTime: false,
    nextOptimalDelay: 300000,
    lastActivity: Date.now() - 600000,
    engagementScore: 0.75,
    streak: 5,
    rateLimitStatus: mockServices.rateLimitService.getRateLimitStatus()
  }),
  
  getBehavioralInsights: () => ({
    procrastinationRisk: 'medium',
    interventionTiming: 'gentle',
    completionProbability: 0.68,
    suggestedAction: 'Set a 15-minute timer and begin with the easiest part',
    confidence: 0.72,
    nextOptimalHour: 14,
    behaviorPattern: '3/10 recent completions at 14:00',
    activeExperiments: mockServices.abTestService.getCurrentExperiments()
  }),
  
  getMotivationStats: () => ({
    streak: 5,
    engagement: 0.75,
    motivationLevel: 'medium',
    nextMotivationType: 'momentum'
  }),
  
  getPredictiveInsights: () => ({
    nextOptimalHour: 14,
    confidence: 0.72,
    reason: '3/10 recent completions at 14:00',
    productivityWindows: [
      { start: 9, end: 11, score: 0.8 },
      { start: 14, end: 16, score: 0.7 }
    ],
    completionCount: 25,
    averageCompletionHour: 13
  }),
  
  getActiveExperiments: () => mockServices.abTestService.getCurrentExperiments()
};

// Simulate the health monitor
class MockNeuralNudgeHealthMonitor {
  constructor() {
    this.metrics = new Map();
    this.healthHistory = [];
    this.initializeTestData();
  }
  
  initializeTestData() {
    // Simulate 24 hours of data
    this.metrics.set('nudges_sent_24h', 48);
    this.metrics.set('nudges_successful_24h', 44);
    this.metrics.set('user_engagements_24h', 36);
    this.metrics.set('task_completions_24h', 28);
    this.metrics.set('response_times', [45, 52, 38, 67, 41, 55, 49, 43, 58, 46]);
    this.metrics.set('error_count_24h', 4);
    this.metrics.set('rate_limit_hits_24h', 2);
  }
  
  async assessOverallHealth() {
    const effectiveness = await this.calculateEffectiveness();
    const reliability = await this.calculateReliability();
    const userSatisfaction = await this.calculateUserSatisfaction();
    const systemHealth = await this.calculateSystemHealth();
    
    const overall = (effectiveness + reliability + userSatisfaction + systemHealth) / 4;
    
    return {
      overall: Math.round(overall * 100) / 100,
      effectiveness: Math.round(effectiveness * 100) / 100,
      reliability: Math.round(reliability * 100) / 100,
      userSatisfaction: Math.round(userSatisfaction * 100) / 100,
      systemHealth: Math.round(systemHealth * 100) / 100
    };
  }
  
  async calculateEffectiveness() {
    const nudgesSent = this.metrics.get('nudges_sent_24h') || 0;
    const taskCompletions = this.metrics.get('task_completions_24h') || 0;
    const userEngagements = this.metrics.get('user_engagements_24h') || 0;
    
    if (nudgesSent === 0) return 0.5;
    
    const conversionRate = taskCompletions / nudgesSent;
    const engagementRate = userEngagements / nudgesSent;
    const predictionAccuracy = mockNotificationService.getBehavioralInsights().confidence;
    
    const effectiveness = (
      conversionRate * 0.4 +
      engagementRate * 0.3 +
      predictionAccuracy * 0.3
    );
    
    return Math.min(1, effectiveness);
  }
  
  async calculateReliability() {
    const nudgesSent = this.metrics.get('nudges_sent_24h') || 0;
    const nudgesSuccessful = this.metrics.get('nudges_successful_24h') || 0;
    const errorCount = this.metrics.get('error_count_24h') || 0;
    const rateLimitHits = this.metrics.get('rate_limit_hits_24h') || 0;
    
    if (nudgesSent === 0) return 1;
    
    const successRate = nudgesSuccessful / nudgesSent;
    const errorRate = errorCount / nudgesSent;
    const rateLimitRate = rateLimitHits / nudgesSent;
    
    const reliability = successRate - (errorRate * 0.5) - (rateLimitRate * 0.3);
    
    return Math.max(0, Math.min(1, reliability));
  }
  
  async calculateUserSatisfaction() {
    const prefs = mockServices.userPreferencesService.getPreferences();
    const motivationStats = mockNotificationService.getMotivationStats();
    const notificationStats = mockNotificationService.getNotificationStats();
    
    const notificationsEnabled = prefs.notifications?.enabled ? 1 : 0;
    const hapticsEnabled = prefs.haptics?.enabled ? 1 : 0;
    const engagementScore = notificationStats.engagementScore;
    const streakBonus = Math.min(1, motivationStats.streak / 10);
    const quietTimeRespect = notificationStats.isQuietTime ? 0.8 : 1;
    
    const satisfaction = (
      (notificationsEnabled + hapticsEnabled) / 2 * 0.3 +
      engagementScore * 0.4 +
      streakBonus * 0.2 +
      quietTimeRespect * 0.1
    );
    
    return Math.min(1, satisfaction);
  }
  
  async calculateSystemHealth() {
    const rateLimitStatus = mockServices.rateLimitService.getRateLimitStatus();
    const responseTimes = this.metrics.get('response_times') || [];
    const errorRate = this.metrics.get('error_count_24h') || 0;
    const nudgesSent = this.metrics.get('nudges_sent_24h') || 1;
    
    const rateLimitHealth = rateLimitStatus.remaining / rateLimitStatus.limit;
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 50;
    const responseTimeHealth = Math.max(0, Math.min(1, (1000 - avgResponseTime) / 1000));
    
    const errorRateHealth = Math.max(0, 1 - (errorRate / nudgesSent));
    
    const systemHealth = (
      rateLimitHealth * 0.4 +
      responseTimeHealth * 0.3 +
      errorRateHealth * 0.3
    );
    
    return systemHealth;
  }
  
  getPerformanceMetrics() {
    const predictiveInsights = mockNotificationService.getPredictiveInsights();
    const behavioralInsights = mockNotificationService.getBehavioralInsights();
    const activeExperiments = mockNotificationService.getActiveExperiments();
    
    return {
      nudgeFrequency: this.calculateNudgeFrequency(),
      optimalTimingAccuracy: predictiveInsights.confidence,
      contextualRelevance: this.calculateContextualRelevance(),
      behavioralPredictionAccuracy: behavioralInsights.confidence,
      abTestConvergence: this.calculateABTestConvergence(activeExperiments)
    };
  }
  
  calculateNudgeFrequency() {
    const nudgesSent = this.metrics.get('nudges_sent_24h') || 0;
    return nudgesSent / 24;
  }
  
  calculateContextualRelevance() {
    const userEngagements = this.metrics.get('user_engagements_24h') || 0;
    const nudgesSent = this.metrics.get('nudges_sent_24h') || 1;
    return userEngagements / nudgesSent;
  }
  
  calculateABTestConvergence(experiments) {
    if (experiments.length === 0) return 1;
    
    let totalConvergence = 0;
    experiments.forEach(exp => {
      const sampleSize = exp.metrics?.sample_size || 0;
      const confidence = Math.min(1, sampleSize / 100);
      totalConvergence += confidence;
    });
    
    return totalConvergence / experiments.length;
  }
  
  getSystemHealthDetails() {
    const rateLimitStatus = mockServices.rateLimitService.getRateLimitStatus();
    const responseTimes = this.metrics.get('response_times') || [];
    const errorCount = this.metrics.get('error_count_24h') || 0;
    const nudgesSent = this.metrics.get('nudges_sent_24h') || 1;
    const activeExperiments = mockNotificationService.getActiveExperiments();
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    
    let rateLimitHealthStatus = 'healthy';
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
  
  estimateMemoryUsage() {
    const historySize = this.healthHistory.length;
    const metricsSize = this.metrics.size;
    return (historySize * 0.1) + (metricsSize * 0.05);
  }
  
  getHealthRecommendations() {
    const recommendations = [];
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
  
  generateHealthReport() {
    return this.assessOverallHealth().then(healthScore => ({
      timestamp: new Date().toISOString(),
      healthScore,
      performanceMetrics: this.getPerformanceMetrics(),
      systemHealth: this.getSystemHealthDetails(),
      recommendations: this.getHealthRecommendations(),
      summary: {
        status: this.getOverallStatus(healthScore),
        criticalIssues: this.getHealthRecommendations().filter(r => r.includes('🚨')).length,
        warnings: this.getHealthRecommendations().filter(r => r.includes('⚠️')).length
      }
    }));
  }
  
  getOverallStatus(healthScore) {
    if (healthScore.overall >= 0.9) return 'excellent';
    if (healthScore.overall >= 0.75) return 'good';
    if (healthScore.overall >= 0.6) return 'fair';
    if (healthScore.overall >= 0.4) return 'poor';
    return 'critical';
  }
}

// Run the analysis
async function runHealthAnalysis() {
  console.log('🧠 Starting Neural Nudge Health Analysis...');
  
  const monitor = new MockNeuralNudgeHealthMonitor();
  const report = await monitor.generateHealthReport();
  
  // Write report to file
  const reportPath = process.argv[2] || 'health_report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('📊 Health Analysis Complete!');
  console.log('📄 Report saved to:', reportPath);
  
  // Print summary to console
  console.log('\n=== HEALTH SUMMARY ===');
  console.log(`Overall Status: ${report.summary.status.toUpperCase()}`);
  console.log(`Overall Score: ${(report.healthScore.overall * 100).toFixed(1)}%`);
  console.log(`Critical Issues: ${report.summary.criticalIssues}`);
  console.log(`Warnings: ${report.summary.warnings}`);
  
  console.log('\n=== DETAILED SCORES ===');
  console.log(`Effectiveness: ${(report.healthScore.effectiveness * 100).toFixed(1)}%`);
  console.log(`Reliability: ${(report.healthScore.reliability * 100).toFixed(1)}%`);
  console.log(`User Satisfaction: ${(report.healthScore.userSatisfaction * 100).toFixed(1)}%`);
  console.log(`System Health: ${(report.healthScore.systemHealth * 100).toFixed(1)}%`);
  
  console.log('\n=== PERFORMANCE METRICS ===');
  console.log(`Nudge Frequency: ${report.performanceMetrics.nudgeFrequency.toFixed(2)}/hour`);
  console.log(`Timing Accuracy: ${(report.performanceMetrics.optimalTimingAccuracy * 100).toFixed(1)}%`);
  console.log(`Contextual Relevance: ${(report.performanceMetrics.contextualRelevance * 100).toFixed(1)}%`);
  console.log(`Prediction Accuracy: ${(report.performanceMetrics.behavioralPredictionAccuracy * 100).toFixed(1)}%`);
  console.log(`A/B Test Convergence: ${(report.performanceMetrics.abTestConvergence * 100).toFixed(1)}%`);
  
  console.log('\n=== RECOMMENDATIONS ===');
  report.recommendations.forEach(rec => console.log(`  ${rec}`));
  
  return report;
}

runHealthAnalysis().catch(console.error);
