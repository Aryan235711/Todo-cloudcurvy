// Phase 6.2: Performance Monitoring Service
export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  context?: string;
}

class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = [];
  private readonly SLOW_THRESHOLD = 1000; // 1 second
  private readonly MAX_METRICS = 100; // Keep last 100 metrics

  trackPerformance(operation: string, duration: number, context?: string): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      context
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow operations
    if (duration > this.SLOW_THRESHOLD) {
      console.warn(`🐌 Slow operation: ${operation} took ${duration}ms${context ? ` (${context})` : ''}`);
    }
  }

  measureAsync<T>(operation: string, fn: () => Promise<T>, context?: string): Promise<T> {
    const start = performance.now();
    return fn().finally(() => {
      const duration = performance.now() - start;
      this.trackPerformance(operation, duration, context);
    });
  }

  measureSync<T>(operation: string, fn: () => T, context?: string): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.trackPerformance(operation, duration, context);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getSlowOperations(): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > this.SLOW_THRESHOLD);
  }

  getAverageTime(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;
    
    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / operationMetrics.length;
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  getPerformanceReport(): {
    totalOperations: number;
    slowOperations: number;
    averageTime: number;
    slowestOperation?: PerformanceMetric;
  } {
    const slowOps = this.getSlowOperations();
    const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const avgTime = this.metrics.length > 0 ? totalTime / this.metrics.length : 0;
    const slowest = this.metrics.reduce((prev, current) => 
      (prev.duration > current.duration) ? prev : current, this.metrics[0]);

    return {
      totalOperations: this.metrics.length,
      slowOperations: slowOps.length,
      averageTime: Math.round(avgTime * 100) / 100,
      slowestOperation: slowest
    };
  }
}

export const performanceMonitor = new PerformanceMonitorService();