// services/activityLogger.ts - Comprehensive App Activity Tracker with localStorage
interface ActivityLog {
  id: string;
  timestamp: number;
  category: 'user_action' | 'neural_nudge' | 'ai_generation' | 'notification' | 'system' | 'data_change';
  action: string;
  details: any;
  context?: string;
  performance?: {
    duration: number;
    memory?: number;
  };
}

class ActivityLogger {
  private logs: ActivityLog[] = [];
  private maxLogs = 10000; // Keep last 10k activities
  private sessionId = crypto.randomUUID();
  private storageKey = 'loop_activity_logs';

  constructor() {
    this.loadFromStorage();
    this.setupAutoSave();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.logs = data.logs || [];
        console.log(`[ActivityLogger] Loaded ${this.logs.length} activities from storage`);
      }
    } catch (error) {
      console.warn('[ActivityLogger] Failed to load from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const data = {
        sessionId: this.sessionId,
        logs: this.logs,
        lastSaved: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('[ActivityLogger] Failed to save to storage:', error);
    }
  }

  private setupAutoSave() {
    // Auto-save every 30 seconds
    setInterval(() => {
      this.saveToStorage();
    }, 30000);

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveToStorage();
    });
  }

  log(category: ActivityLog['category'], action: string, details: any, context?: string, performance?: ActivityLog['performance']) {
    const activity: ActivityLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      category,
      action,
      details: this.sanitizeDetails(details),
      context,
      performance
    };

    this.logs.push(activity);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Immediate save for critical events
    if (category === 'system' && (action.includes('error') || action.includes('crash'))) {
      this.saveToStorage();
    }

    // Real-time console output for debugging
    console.log(`[${category.toUpperCase()}] ${action}:`, details);
  }

  private sanitizeDetails(details: any): any {
    if (typeof details === 'string') return details;
    if (typeof details === 'object' && details !== null) {
      const sanitized = { ...details };
      // Remove sensitive data
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.apiKey;
      return sanitized;
    }
    return details;
  }

  // Export comprehensive activity report
  exportActivityReport(): string {
    const report = {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      totalActivities: this.logs.length,
      timeRange: {
        start: new Date(this.logs[0]?.timestamp || Date.now()).toISOString(),
        end: new Date(this.logs[this.logs.length - 1]?.timestamp || Date.now()).toISOString()
      },
      categories: this.getCategoryStats(),
      activities: this.logs,
      summary: this.generateSummary(),
      storageInfo: {
        storageSize: localStorage.getItem(this.storageKey)?.length || 0,
        lastSaved: new Date().toISOString()
      }
    };

    return JSON.stringify(report, null, 2);
  }

  private getCategoryStats() {
    const stats: Record<string, number> = {};
    this.logs.forEach(log => {
      stats[log.category] = (stats[log.category] || 0) + 1;
    });
    return stats;
  }

  private generateSummary() {
    return {
      userActions: this.logs.filter(l => l.category === 'user_action').length,
      neuralNudges: this.logs.filter(l => l.category === 'neural_nudge').length,
      aiGenerations: this.logs.filter(l => l.category === 'ai_generation').length,
      notifications: this.logs.filter(l => l.category === 'notification').length,
      dataChanges: this.logs.filter(l => l.category === 'data_change').length,
      systemEvents: this.logs.filter(l => l.category === 'system').length
    };
  }

  // Get logs by category
  getLogsByCategory(category: ActivityLog['category']): ActivityLog[] {
    return this.logs.filter(log => log.category === category);
  }

  // Get logs by time range
  getLogsByTimeRange(startTime: number, endTime: number): ActivityLog[] {
    return this.logs.filter(log => log.timestamp >= startTime && log.timestamp <= endTime);
  }

  // Clear logs and storage
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem(this.storageKey);
    console.log('[ActivityLogger] Logs cleared from memory and storage');
  }

  // Force save to storage
  forceSave(): void {
    this.saveToStorage();
  }

  // Get storage stats
  getStorageStats() {
    const stored = localStorage.getItem(this.storageKey);
    return {
      totalLogs: this.logs.length,
      storageSize: stored?.length || 0,
      storageSizeKB: Math.round((stored?.length || 0) / 1024),
      lastActivity: this.logs[this.logs.length - 1]?.timestamp || 0
    };
  }
}

export const activityLogger = new ActivityLogger();