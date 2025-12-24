// A/B Testing Framework for Neural Nudge Optimization
export interface ExperimentConfig {
  name: string;
  variants: string[];
  trafficAllocation: number; // 0-1, percentage of users in experiment
}

export interface ExperimentMetric {
  experiment: string;
  variant: string;
  metric: string;
  value: number;
  timestamp: number;
  userId: string;
}

class ABTestService {
  private userId: string;
  private experiments: Map<string, ExperimentConfig> = new Map();
  private metrics: ExperimentMetric[] = [];

  constructor() {
    this.userId = this.getOrCreateUserId();
    this.initializeExperiments();
    this.loadMetrics();
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('curvycloud_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('curvycloud_user_id', userId);
    }
    return userId;
  }

  private initializeExperiments() {
    // Intervention Timing Experiment
    this.experiments.set('intervention_timing', {
      name: 'Intervention Timing Strategy',
      variants: ['aggressive', 'gentle', 'adaptive'],
      trafficAllocation: 1.0 // 100% of users
    });

    // Notification Frequency Experiment  
    this.experiments.set('notification_frequency', {
      name: 'Notification Frequency',
      variants: ['high_frequency', 'low_frequency'],
      trafficAllocation: 0.8 // 80% of users
    });

    // Message Tone Experiment
    this.experiments.set('message_tone', {
      name: 'Motivational Message Tone',
      variants: ['encouraging', 'urgent', 'neutral'],
      trafficAllocation: 0.6 // 60% of users
    });
  }

  private loadMetrics() {
    const stored = localStorage.getItem('curvycloud_ab_metrics');
    if (stored) {
      try {
        this.metrics = JSON.parse(stored);
      } catch (e) {
        this.metrics = [];
      }
    }
  }

  private saveMetrics() {
    // Keep only last 1000 metrics to prevent storage bloat
    const recentMetrics = this.metrics.slice(-1000);
    localStorage.setItem('curvycloud_ab_metrics', JSON.stringify(recentMetrics));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getVariant(experimentName: string): string | null {
    const experiment = this.experiments.get(experimentName);
    if (!experiment) return null;

    // Check if user is in experiment based on traffic allocation
    const userHash = this.simpleHash(this.userId + experimentName);
    const userBucket = (userHash % 100) / 100;
    
    if (userBucket > experiment.trafficAllocation) {
      return null; // User not in experiment
    }

    // Assign variant deterministically
    const variantHash = this.simpleHash(this.userId + experimentName + 'variant');
    const variantIndex = variantHash % experiment.variants.length;
    
    return experiment.variants[variantIndex];
  }

  trackMetric(experiment: string, metric: string, value: number) {
    const variant = this.getVariant(experiment);
    if (!variant) return; // User not in experiment

    const metricData: ExperimentMetric = {
      experiment,
      variant,
      metric,
      value,
      timestamp: Date.now(),
      userId: this.userId
    };

    this.metrics.push(metricData);
    this.saveMetrics();

    // Debug logging
    console.log(`[A/B Test] ${experiment}:${variant} - ${metric}: ${value}`);
  }

  getExperimentResults(experimentName: string) {
    const experimentMetrics = this.metrics.filter(m => m.experiment === experimentName);
    const results: Record<string, any> = {};

    // Group by variant
    const variantGroups = experimentMetrics.reduce((acc, metric) => {
      if (!acc[metric.variant]) acc[metric.variant] = [];
      acc[metric.variant].push(metric);
      return acc;
    }, {} as Record<string, ExperimentMetric[]>);

    // Calculate stats per variant
    Object.entries(variantGroups).forEach(([variant, metrics]) => {
      const completionRate = metrics.filter(m => m.metric === 'task_completed').length / 
                            Math.max(1, metrics.filter(m => m.metric === 'intervention_sent').length);
      
      const avgEngagement = metrics
        .filter(m => m.metric === 'engagement_score')
        .reduce((sum, m) => sum + m.value, 0) / 
        Math.max(1, metrics.filter(m => m.metric === 'engagement_score').length);

      results[variant] = {
        sampleSize: metrics.length,
        completionRate: completionRate || 0,
        avgEngagement: avgEngagement || 0,
        totalInterventions: metrics.filter(m => m.metric === 'intervention_sent').length
      };
    });

    return results;
  }

  getCurrentExperiments() {
    const active: Record<string, string> = {};
    this.experiments.forEach((config, name) => {
      const variant = this.getVariant(name);
      if (variant) {
        active[name] = variant;
      }
    });
    return active;
  }
}

export const abTestService = new ABTestService();