// hooks/useActivityTracker.ts - Enhanced auto-tracking with state validation
import { useEffect, useCallback } from 'react';
import { activityLogger } from '../services/activityLogger';
import { stateValidator } from '../services/stateValidationLogger';
import { safeJsonParse } from '../utils/safeJson';

export const useActivityTracker = () => {
  useEffect(() => {
    // Track page/component loads
    activityLogger.log('system', 'component_mount', {
      component: 'App',
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    });

    // Enhanced click tracking with state validation
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const buttonText = target.textContent?.trim() || '';
      
      // Determine expected outcome based on button/element
      let expectedOutcome = 'ui_change';
      if (buttonText.includes('Optimize Storage')) expectedOutcome = 'storage_optimized';
      if (buttonText.includes('Add Todo') || buttonText.includes('Create')) expectedOutcome = 'todo_created';
      if (buttonText.includes('Complete') || (target as HTMLInputElement).type === 'checkbox') expectedOutcome = 'todo_completed';
      if (buttonText.includes('Send') || buttonText.includes('Notify')) expectedOutcome = 'notification_sent';
      if (buttonText.includes('Generate') || buttonText.includes('AI')) expectedOutcome = 'ai_generated';
      if (buttonText.includes('Nudge') || buttonText.includes('Neural')) expectedOutcome = 'neural_nudge_triggered';

      // Capture pre-interaction state
      const preState = {
        todos: safeJsonParse(localStorage.getItem('todos'), []),
        storageUsage: localStorage.length,
        timestamp: Date.now()
      };

      // Log the interaction with validation
      const interactionId = stateValidator.logUIInteraction(
        target.tagName,
        'click',
        expectedOutcome,
        preState
      );

      // Standard activity logging
      activityLogger.log('user_action', 'click', {
        interactionId,
        element: target.tagName,
        className: target.className,
        id: target.id,
        text: buttonText.substring(0, 50),
        expectedOutcome,
        coordinates: { x: e.clientX, y: e.clientY }
      });

      // Validate state change after a delay
      setTimeout(() => {
        const postState = {
          todos: safeJsonParse(localStorage.getItem('todos'), []),
          storageUsage: localStorage.length,
          timestamp: Date.now()
        };
        
        stateValidator.validateInteraction(interactionId, postState);
      }, 1000);
    };

    // Enhanced input tracking
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      
      activityLogger.log('user_action', 'input', {
        type: target.type,
        name: target.name,
        valueLength: target.value.length,
        placeholder: target.placeholder,
        timestamp: Date.now()
      });
    };

    // Form submission tracking with validation
    const handleSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const preState = {
        todos: safeJsonParse(localStorage.getItem('todos'), []),
        templates: safeJsonParse(localStorage.getItem('templates'), [])
      };

      const interactionId = stateValidator.logUIInteraction(
        'FORM',
        'submit',
        'data_change',
        preState
      );

      activityLogger.log('user_action', 'form_submit', {
        interactionId,
        formId: form.id,
        fieldCount: formData.entries.length,
        timestamp: Date.now()
      });

      setTimeout(() => {
        const postState = {
          todos: safeJsonParse(localStorage.getItem('todos'), []),
          templates: safeJsonParse(localStorage.getItem('templates'), [])
        };
        stateValidator.validateInteraction(interactionId, postState);
      }, 500);
    };

    // Error tracking
    const handleError = (e: ErrorEvent) => {
      activityLogger.log('system', 'javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack?.substring(0, 200),
        timestamp: Date.now()
      });
    };

    // Unhandled promise rejection tracking
    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      activityLogger.log('system', 'unhandled_promise_rejection', {
        reason: e.reason?.toString?.() || 'Unknown',
        timestamp: Date.now()
      });
    };

    // Performance tracking
    const trackPerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        activityLogger.log('system', 'performance_metrics', {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          timestamp: Date.now()
        });
      }
    };

    // State snapshot every 30 seconds
    const stateSnapshotInterval = setInterval(() => {
      const currentState = {
        todos: safeJsonParse(localStorage.getItem('todos'), []),
        templates: safeJsonParse(localStorage.getItem('templates'), []),
        storageUsage: localStorage.length,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        timestamp: Date.now()
      };
      
      stateValidator.takeStateSnapshot('app_state', currentState);
    }, 30000);

    // Add event listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('input', handleInput);
    document.addEventListener('submit', handleSubmit);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Track initial performance
    if (document.readyState === 'complete') {
      trackPerformance();
    } else {
      window.addEventListener('load', trackPerformance);
    }

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('input', handleInput);
      document.removeEventListener('submit', handleSubmit);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      clearInterval(stateSnapshotInterval);
    };
  }, []);

  // Manual logging functions
  const logActivity = useCallback((category: 'system' | 'user_action' | 'neural_nudge' | 'ai_generation' | 'notification' | 'data_change', action: string, details: Record<string, unknown>, context?: string) => {
    activityLogger.log(category, action, details, context);
  }, []);

  const logUIInteraction = useCallback((element: string, action: string, expectedOutcome: string, preState: Record<string, unknown>) => {
    return stateValidator.logUIInteraction(element, action, expectedOutcome, preState);
  }, []);

  const validateInteraction = useCallback((interactionId: string, actualState: Record<string, unknown>) => {
    return stateValidator.validateInteraction(interactionId, actualState);
  }, []);

  const exportReport = useCallback(() => {
    return activityLogger.exportActivityReport();
  }, []);

  const exportValidationReport = useCallback(() => {
    return stateValidator.exportValidationReport();
  }, []);

  return {
    logActivity,
    logUIInteraction,
    validateInteraction,
    exportReport,
    exportValidationReport
  };
};