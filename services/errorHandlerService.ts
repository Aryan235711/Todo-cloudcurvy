/**
 * Error Handler Service
 * Centralized error handling without crashing the app
 */

class ErrorHandlerService {
  private errorCount = 0;
  private readonly MAX_ERRORS = 10;

  handleError(error: Error, context: string, metadata?: Record<string, any>) {
    this.errorCount++;
    
    // Log error with context
    console.error(`🚨 [${context}]`, error.message, metadata);
    
    // Track for analytics (non-blocking)
    this.trackError(error, context, metadata);
    
    // Prevent error spam
    if (this.errorCount > this.MAX_ERRORS) {
      console.warn('🛑 Too many errors, suppressing further logging');
      return;
    }
  }

  handleAsyncError(promise: Promise<any>, context: string) {
    return promise.catch(error => {
      this.handleError(error, context);
      return null; // Return null instead of throwing
    });
  }

  private trackError(error: Error, context: string, metadata?: Record<string, any>) {
    try {
      if (typeof window !== 'undefined' && window.analytics?.track) {
        window.analytics.track('error_occurred', {
          context,
          message: error.message,
          stack: error.stack?.substring(0, 200),
          metadata: metadata ? JSON.stringify(metadata).substring(0, 100) : undefined,
          timestamp: Date.now()
        });
      }
    } catch {
      // Silent fail for error tracking
    }
  }

  resetErrorCount() {
    this.errorCount = 0;
  }

  getErrorCount() {
    return this.errorCount;
  }
}

export const errorHandler = new ErrorHandlerService();

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error || new Error(event.message), 'global_error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(
      new Error(event.reason?.message || 'Unhandled promise rejection'), 
      'unhandled_promise'
    );
  });
}