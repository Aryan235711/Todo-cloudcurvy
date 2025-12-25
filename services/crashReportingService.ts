/**
 * Privacy-First Crash Reporting Service
 * Logs errors locally without sending data to external services
 */

interface CrashReport {
  id: string;
  timestamp: number;
  error: string;
  stack?: string;
  userAgent: string;
  url: string;
  userId?: string;
}

class CrashReportingService {
  private readonly STORAGE_KEY = 'curvycloud_crash_reports';
  private readonly MAX_REPORTS = 50;

  init() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logCrash({
        error: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        line: event.lineno,
        column: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logCrash({
        error: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href
      });
    });

    // React error boundary integration
    this.setupReactErrorHandler();
  }

  private setupReactErrorHandler() {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Detect React errors
      if (args[0]?.includes?.('React') || args[0]?.includes?.('component')) {
        this.logCrash({
          error: args.join(' '),
          url: window.location.href,
          type: 'react'
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  logCrash(details: {
    error: string;
    stack?: string;
    url: string;
    line?: number;
    column?: number;
    type?: string;
  }) {
    const report: CrashReport = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      error: details.error,
      stack: details.stack,
      userAgent: navigator.userAgent,
      url: details.url
    };

    try {
      const reports = this.getReports();
      reports.unshift(report);
      
      // Keep only recent reports
      const trimmedReports = reports.slice(0, this.MAX_REPORTS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedReports));
      
      // Log to console in development
      if (import.meta.env.DEV) {
        console.error('Crash Report:', report);
      }
    } catch (e) {
      // Fail silently if localStorage is full
      console.warn('Failed to save crash report:', e);
    }
  }

  getReports(): CrashReport[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearReports() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getReportSummary() {
    const reports = this.getReports();
    const last24h = reports.filter(r => Date.now() - r.timestamp < 24 * 60 * 60 * 1000);
    
    return {
      total: reports.length,
      last24h: last24h.length,
      mostRecent: reports[0]?.timestamp || null,
      commonErrors: this.getCommonErrors(reports)
    };
  }

  private getCommonErrors(reports: CrashReport[]) {
    const errorCounts: Record<string, number> = {};
    reports.forEach(report => {
      const errorKey = report.error.split('\n')[0]; // First line of error
      errorCounts[errorKey] = (errorCounts[errorKey] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }
}

export const crashReportingService = new CrashReportingService();