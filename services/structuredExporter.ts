// services/structuredExporter.ts - COMPLETE structured export for analysis
import { activityLogger } from './activityLogger';
import { useTodoStore } from '../stores/todoStore';

interface ComprehensiveExport {
  metadata: {
    exportTime: string;
    sessionId: string;
    sessionDuration: number;
    appVersion: string;
    platform: string;
    deviceInfo: string;
    networkStatus: string;
    batteryLevel?: number;
    screenResolution: string;
    timezone: string;
    language: string;
  };
  
  summary: {
    totalActivities: number;
    userActions: number;
    neuralNudges: number;
    aiGenerations: number;
    notifications: number;
    dataChanges: number;
    systemEvents: number;
    errors: number;
    crashes: number;
  };
  
  patterns: {
    mostUsedFeatures: Array<{ feature: string; count: number; percentage: number }>;
    peakUsageHours: Array<{ hour: number; activities: number; dayOfWeek?: string }>;
    sessionPatterns: Array<{ date: string; duration: number; activities: number }>;
    averageSessionTime: number;
    errorRate: number;
    retentionMetrics: { dailyActive: boolean; weeklyActive: boolean };
  };
  
  neuralNudgeAnalysis: {
    totalTriggers: number;
    successRate: number;
    averageResponseTime: number;
    mostEffectiveMessages: Array<{ message: string; successRate: number }>;
    triggerContexts: Array<{ context: string; frequency: number }>;
    userResponsePatterns: Array<{ response: string; count: number }>;
    timingEffectiveness: Array<{ timeOfDay: number; successRate: number }>;
    adaptationLearning: { improvementOverTime: number; personalizedAccuracy: number };
  };
  
  aiInteractions: {
    totalGenerations: number;
    averageResponseTime: number;
    templateCreations: number;
    successfulGenerations: number;
    failureReasons: Array<{ reason: string; count: number }>;
    apiUsage: { totalCalls: number; averageLatency: number; errorRate: number };
    contentQuality: { averageLength: number; complexityScore: number };
    userSatisfaction: { acceptanceRate: number; editRate: number };
  };
  
  userBehavior: {
    clickPatterns: Array<{ element: string; frequency: number; avgDuration: number }>;
    navigationFlow: Array<{ from: string; to: string; frequency: number }>;
    voiceCommandUsage: { total: number; successRate: number; mostUsed: string[] };
    gestureInteractions: { swipes: number; taps: number; longPresses: number };
    inputPatterns: { textInput: number; voiceInput: number; gestureInput: number };
    featureAdoption: Array<{ feature: string; firstUse: string; frequency: number }>;
    abandonmentPoints: Array<{ action: string; abandonmentRate: number }>;
  };
  
  performance: {
    averageLoadTime: number;
    memoryUsage: { current: number; peak: number; average: number };
    cpuUsage: number;
    networkRequests: { total: number; failed: number; averageTime: number };
    renderingMetrics: { fps: number; frameDrops: number };
    errorCount: number;
    crashCount: number;
    batteryImpact: number;
    storageUsage: { localStorage: number; sessionStorage: number; indexedDB: number };
  };
  
  dataSnapshot: {
    todoCount: number;
    templateCount: number;
    completionRate: number;
    averageTaskDuration: number;
    taskCategories: Array<{ category: string; count: number }>;
    productivityMetrics: {
      tasksPerDay: number;
      streakDays: number;
      focusTime: number;
      procrastinationRate: number;
    };
    dataGrowth: { todosCreated: number; todosDeleted: number; templatesCreated: number };
  };
  
  securityMetrics: {
    authenticationEvents: number;
    permissionRequests: Array<{ permission: string; granted: boolean; timestamp: string }>;
    dataExports: number;
    sensitiveDataAccess: number;
    securityErrors: Array<{ type: string; count: number }>;
  };
  
  accessibilityMetrics: {
    screenReaderUsage: boolean;
    keyboardNavigation: number;
    voiceControlUsage: number;
    highContrastMode: boolean;
    textSizeAdjustments: number;
  };
  
  notificationAnalysis: {
    totalSent: number;
    deliveryRate: number;
    openRate: number;
    actionRate: number;
    optOutRate: number;
    timingPreferences: Array<{ hour: number; effectiveness: number }>;
    typeEffectiveness: Array<{ type: string; engagementRate: number }>;
  };
  
  offlineUsage: {
    offlineTime: number;
    offlineActions: number;
    syncConflicts: number;
    dataLoss: number;
  };
  
  experimentalFeatures: {
    betaFeaturesUsed: string[];
    featureFlagStates: Record<string, boolean>;
    abTestParticipation: Array<{ test: string; variant: string; outcome: string }>;
  };
  
  businessMetrics: {
    userEngagement: { dailyActiveTime: number; weeklyActiveTime: number };
    featureUtilization: Array<{ feature: string; utilizationRate: number }>;
    userJourney: Array<{ step: string; completionRate: number; dropOffRate: number }>;
    conversionFunnels: Array<{ funnel: string; conversionRate: number }>;
  };
  
  technicalHealth: {
    apiEndpointHealth: Array<{ endpoint: string; uptime: number; errorRate: number }>;
    componentRenderCounts: Array<{ component: string; renders: number }>;
    memoryLeaks: Array<{ component: string; leakSize: number }>;
    bundleAnalysis: { totalSize: number; unusedCode: number; duplicateCode: number };
  };
  
  // Critical activities for debugging
  criticalEvents: Array<{
    timestamp: string;
    category: string;
    action: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: any;
  }>;
  
  // Recent activities (last 100 for context)
  recentActivities: any[];
}

export class StructuredExporter {
  static generateComprehensiveExport(): ComprehensiveExport {
    const logs = JSON.parse(activityLogger.exportActivityReport());
    const activities = logs.activities || [];
    const { todos, templates } = useTodoStore.getState();
    
    // Categorize activities
    const userActions = activities.filter(a => a.category === 'user_action');
    const neuralNudges = activities.filter(a => a.category === 'neural_nudge');
    const aiGenerations = activities.filter(a => a.category === 'ai_generation');
    const notifications = activities.filter(a => a.category === 'notification');
    const systemEvents = activities.filter(a => a.category === 'system');
    const errors = activities.filter(a => a.action?.includes('error') || a.category === 'error');
    
    // Advanced analytics
    const featureUsage = new Map<string, number>();
    const clickPatterns = new Map<string, { count: number; totalDuration: number }>();
    const navigationFlow = new Map<string, number>();
    
    userActions.forEach(action => {
      const feature = action.action || 'unknown';
      featureUsage.set(feature, (featureUsage.get(feature) || 0) + 1);
      
      if (action.action === 'click') {
        const element = action.details?.element || 'unknown';
        const current = clickPatterns.get(element) || { count: 0, totalDuration: 0 };
        clickPatterns.set(element, {
          count: current.count + 1,
          totalDuration: current.totalDuration + (action.performance?.duration || 0)
        });
      }
    });
    
    // Time-based analysis
    const hourlyActivity = new Array(24).fill(0);
    const dailyActivity = new Map<string, number>();
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp);
      const hour = date.getHours();
      const day = date.toDateString();
      
      hourlyActivity[hour]++;
      dailyActivity.set(day, (dailyActivity.get(day) || 0) + 1);
    });
    
    // Performance calculations
    const performanceMetrics = activities.filter(a => a.performance?.duration);
    const avgLoadTime = performanceMetrics.length > 0 ? 
      performanceMetrics.reduce((sum, a) => sum + a.performance.duration, 0) / performanceMetrics.length : 0;
    
    // Memory usage
    const memoryInfo = (performance as any).memory;
    
    // Battery API (if available)
    const batteryLevel = (navigator as any).getBattery ? 
      (navigator as any).getBattery().then((battery: any) => battery.level * 100) : undefined;
    
    return {
      metadata: {
        exportTime: new Date().toISOString(),
        sessionId: logs.sessionId || 'unknown',
        sessionDuration: activities.length > 0 ? 
          activities[activities.length - 1].timestamp - activities[0].timestamp : 0,
        appVersion: '1.0.0',
        platform: navigator.platform,
        deviceInfo: navigator.userAgent,
        networkStatus: navigator.onLine ? 'online' : 'offline',
        batteryLevel: batteryLevel,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      },
      
      summary: {
        totalActivities: activities.length,
        userActions: userActions.length,
        neuralNudges: neuralNudges.length,
        aiGenerations: aiGenerations.length,
        notifications: notifications.length,
        dataChanges: activities.filter(a => a.category === 'data_change').length,
        systemEvents: systemEvents.length,
        errors: errors.length,
        crashes: activities.filter(a => a.action === 'crash').length
      },
      
      patterns: {
        mostUsedFeatures: Array.from(featureUsage.entries())
          .map(([feature, count]) => ({ 
            feature, 
            count, 
            percentage: (count / userActions.length) * 100 
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15),
        peakUsageHours: hourlyActivity
          .map((activities, hour) => ({ hour, activities }))
          .filter(h => h.activities > 0)
          .sort((a, b) => b.activities - a.activities)
          .slice(0, 8),
        sessionPatterns: Array.from(dailyActivity.entries())
          .map(([date, activities]) => ({ date, duration: 0, activities }))
          .slice(-7),
        averageSessionTime: avgLoadTime,
        errorRate: (errors.length / activities.length) * 100,
        retentionMetrics: {
          dailyActive: dailyActivity.size >= 1,
          weeklyActive: dailyActivity.size >= 3
        }
      },
      
      neuralNudgeAnalysis: {
        totalTriggers: neuralNudges.length,
        successRate: neuralNudges.length > 0 ? 
          (neuralNudges.filter(n => n.details?.success).length / neuralNudges.length) * 100 : 0,
        averageResponseTime: neuralNudges.length > 0 ?
          neuralNudges.reduce((sum, n) => sum + (n.performance?.duration || 0), 0) / neuralNudges.length : 0,
        mostEffectiveMessages: neuralNudges
          .filter(n => n.details?.success)
          .map(n => ({ message: n.details?.message || 'unknown', successRate: 100 }))
          .slice(0, 5),
        triggerContexts: neuralNudges
          .map(n => n.context || 'unknown')
          .reduce((acc, context) => {
            const existing = acc.find(c => c.context === context);
            if (existing) existing.frequency++;
            else acc.push({ context, frequency: 1 });
            return acc;
          }, [] as Array<{ context: string; frequency: number }>)
          .slice(0, 5),
        userResponsePatterns: [],
        timingEffectiveness: [],
        adaptationLearning: { improvementOverTime: 0, personalizedAccuracy: 0 }
      },
      
      aiInteractions: {
        totalGenerations: aiGenerations.length,
        averageResponseTime: aiGenerations.length > 0 ?
          aiGenerations.reduce((sum, ai) => sum + (ai.performance?.duration || 0), 0) / aiGenerations.length : 0,
        templateCreations: aiGenerations.filter(ai => ai.action === 'template_creation').length,
        successfulGenerations: aiGenerations.filter(ai => ai.details?.success !== false).length,
        failureReasons: [],
        apiUsage: { totalCalls: aiGenerations.length, averageLatency: 0, errorRate: 0 },
        contentQuality: { averageLength: 0, complexityScore: 0 },
        userSatisfaction: { acceptanceRate: 0, editRate: 0 }
      },
      
      userBehavior: {
        clickPatterns: Array.from(clickPatterns.entries())
          .map(([element, data]) => ({ 
            element, 
            frequency: data.count, 
            avgDuration: data.totalDuration / data.count 
          }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 15),
        navigationFlow: [],
        voiceCommandUsage: { 
          total: userActions.filter(a => a.action === 'voice_command').length,
          successRate: 0,
          mostUsed: []
        },
        gestureInteractions: {
          swipes: userActions.filter(a => a.action?.includes('swipe')).length,
          taps: userActions.filter(a => a.action === 'click').length,
          longPresses: userActions.filter(a => a.action?.includes('long')).length
        },
        inputPatterns: {
          textInput: userActions.filter(a => a.action === 'input').length,
          voiceInput: userActions.filter(a => a.action === 'voice_command').length,
          gestureInput: userActions.filter(a => a.action?.includes('gesture')).length
        },
        featureAdoption: [],
        abandonmentPoints: []
      },
      
      performance: {
        averageLoadTime: avgLoadTime,
        memoryUsage: {
          current: memoryInfo?.usedJSHeapSize || 0,
          peak: memoryInfo?.totalJSHeapSize || 0,
          average: memoryInfo?.usedJSHeapSize || 0
        },
        cpuUsage: 0,
        networkRequests: { total: 0, failed: 0, averageTime: 0 },
        renderingMetrics: { fps: 60, frameDrops: 0 },
        errorCount: errors.length,
        crashCount: activities.filter(a => a.action === 'crash').length,
        batteryImpact: 0,
        storageUsage: {
          localStorage: JSON.stringify(localStorage).length,
          sessionStorage: JSON.stringify(sessionStorage).length,
          indexedDB: 0
        }
      },
      
      dataSnapshot: {
        todoCount: todos.length,
        templateCount: templates.length,
        completionRate: todos.length > 0 ? (todos.filter(t => t.completed).length / todos.length) * 100 : 0,
        averageTaskDuration: 0,
        taskCategories: [],
        productivityMetrics: {
          tasksPerDay: 0,
          streakDays: 0,
          focusTime: 0,
          procrastinationRate: 0
        },
        dataGrowth: { todosCreated: 0, todosDeleted: 0, templatesCreated: 0 }
      },
      
      securityMetrics: {
        authenticationEvents: 0,
        permissionRequests: [],
        dataExports: activities.filter(a => a.action?.includes('export')).length,
        sensitiveDataAccess: 0,
        securityErrors: []
      },
      
      accessibilityMetrics: {
        screenReaderUsage: false,
        keyboardNavigation: 0,
        voiceControlUsage: userActions.filter(a => a.action === 'voice_command').length,
        highContrastMode: false,
        textSizeAdjustments: 0
      },
      
      notificationAnalysis: {
        totalSent: notifications.length,
        deliveryRate: 0,
        openRate: 0,
        actionRate: 0,
        optOutRate: 0,
        timingPreferences: [],
        typeEffectiveness: []
      },
      
      offlineUsage: {
        offlineTime: 0,
        offlineActions: 0,
        syncConflicts: 0,
        dataLoss: 0
      },
      
      experimentalFeatures: {
        betaFeaturesUsed: [],
        featureFlagStates: {},
        abTestParticipation: []
      },
      
      businessMetrics: {
        userEngagement: { dailyActiveTime: 0, weeklyActiveTime: 0 },
        featureUtilization: [],
        userJourney: [],
        conversionFunnels: []
      },
      
      technicalHealth: {
        apiEndpointHealth: [],
        componentRenderCounts: [],
        memoryLeaks: [],
        bundleAnalysis: { totalSize: 0, unusedCode: 0, duplicateCode: 0 }
      },
      
      criticalEvents: activities
        .filter(a => errors.includes(a) || a.action?.includes('crash') || a.action?.includes('error'))
        .map(a => ({
          timestamp: new Date(a.timestamp).toISOString(),
          category: a.category,
          action: a.action,
          severity: a.action?.includes('crash') ? 'critical' as const : 'high' as const,
          details: a.details
        }))
        .slice(-20),
      
      recentActivities: activities.slice(-100)
    };
  }
}