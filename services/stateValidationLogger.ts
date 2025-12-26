// services/stateValidationLogger.ts - Track UI interactions vs actual state changes
import { activityLogger } from './activityLogger';

interface StateSnapshot {
  timestamp: number;
  component: string;
  expectedState: any;
  actualState: any;
  isValid: boolean;
  discrepancies: string[];
}

interface UIInteractionLog {
  interactionId: string;
  element: string;
  action: string;
  expectedOutcome: string;
  preState: any;
  postState: any;
  stateChangeDelay: number;
  success: boolean;
  issues: string[];
}

class StateValidationLogger {
  private pendingValidations = new Map<string, any>();
  private stateSnapshots: StateSnapshot[] = [];
  private uiInteractions: UIInteractionLog[] = [];

  // Log UI interaction with expected outcome
  logUIInteraction(element: string, action: string, expectedOutcome: string, preState: any) {
    const interactionId = crypto.randomUUID();
    const startTime = Date.now();

    // Store for later validation
    this.pendingValidations.set(interactionId, {
      element,
      action,
      expectedOutcome,
      preState,
      startTime
    });

    activityLogger.log('user_action', 'ui_interaction_start', {
      interactionId,
      element,
      action,
      expectedOutcome,
      preState: this.sanitizeState(preState)
    });

    // Auto-validate after 2 seconds if not manually validated
    setTimeout(() => {
      if (this.pendingValidations.has(interactionId)) {
        this.validateInteraction(interactionId, null, 'auto_timeout');
      }
    }, 2000);

    return interactionId;
  }

  // Validate the actual outcome of UI interaction
  validateInteraction(interactionId: string, actualState: any, validationType: 'manual' | 'auto_timeout' = 'manual') {
    const pending = this.pendingValidations.get(interactionId);
    if (!pending) return;

    const endTime = Date.now();
    const stateChangeDelay = endTime - pending.startTime;
    
    // Compare expected vs actual
    const issues = this.detectStateDiscrepancies(pending.expectedOutcome, actualState, pending.preState);
    const success = issues.length === 0;

    const interaction: UIInteractionLog = {
      interactionId,
      element: pending.element,
      action: pending.action,
      expectedOutcome: pending.expectedOutcome,
      preState: pending.preState,
      postState: actualState,
      stateChangeDelay,
      success,
      issues
    };

    this.uiInteractions.push(interaction);
    this.pendingValidations.delete(interactionId);

    // Log the validation result
    activityLogger.log('system', 'ui_validation_complete', {
      interactionId,
      success,
      stateChangeDelay,
      issues,
      validationType,
      element: pending.element,
      action: pending.action
    });

    // Log critical UI failures immediately
    if (!success) {
      activityLogger.log('system', 'ui_failure_detected', {
        interactionId,
        element: pending.element,
        action: pending.action,
        expectedOutcome: pending.expectedOutcome,
        actualState: this.sanitizeState(actualState),
        issues,
        severity: issues.length > 2 ? 'critical' : 'medium'
      });
    }

    return interaction;
  }

  // Detect discrepancies between expected and actual state
  private detectStateDiscrepancies(expectedOutcome: string, actualState: any, preState: any): string[] {
    const issues: string[] = [];

    if (!actualState && expectedOutcome !== 'no_change') {
      issues.push('No state change detected when change was expected');
      return issues;
    }

    // Common UI/UX validation patterns
    if (expectedOutcome.includes('storage_optimized')) {
      const storageReduced = this.checkStorageOptimization(preState, actualState);
      if (!storageReduced) {
        issues.push('Storage optimization failed - no reduction in storage usage');
      }
    }

    if (expectedOutcome.includes('todo_created')) {
      const todoAdded = actualState?.todos?.length > (preState?.todos?.length || 0);
      if (!todoAdded) {
        issues.push('Todo creation failed - todo count did not increase');
      }
    }

    if (expectedOutcome.includes('todo_completed')) {
      const completedCount = actualState?.todos?.filter(t => t.completed)?.length || 0;
      const preCompletedCount = preState?.todos?.filter(t => t.completed)?.length || 0;
      if (completedCount <= preCompletedCount) {
        issues.push('Todo completion failed - completed count did not increase');
      }
    }

    if (expectedOutcome.includes('notification_sent')) {
      const notificationSent = actualState?.lastNotification?.timestamp > (preState?.lastNotification?.timestamp || 0);
      if (!notificationSent) {
        issues.push('Notification sending failed - no new notification timestamp');
      }
    }

    if (expectedOutcome.includes('ai_generated')) {
      const aiResponse = actualState?.lastAIResponse;
      if (!aiResponse || aiResponse.timestamp <= (preState?.lastAIResponse?.timestamp || 0)) {
        issues.push('AI generation failed - no new AI response generated');
      }
    }

    if (expectedOutcome.includes('neural_nudge_triggered')) {
      const nudgeTriggered = actualState?.lastNeuralNudge?.timestamp > (preState?.lastNeuralNudge?.timestamp || 0);
      if (!nudgeTriggered) {
        issues.push('Neural nudge failed - no new nudge timestamp');
      }
    }

    return issues;
  }

  private checkStorageOptimization(preState: any, actualState: any): boolean {
    const preStorage = preState?.storageUsage || 0;
    const postStorage = actualState?.storageUsage || 0;
    return postStorage < preStorage;
  }

  // Take periodic state snapshots for validation
  takeStateSnapshot(component: string, currentState: any, expectedState?: any) {
    const snapshot: StateSnapshot = {
      timestamp: Date.now(),
      component,
      expectedState: expectedState || null,
      actualState: currentState,
      isValid: expectedState ? this.deepEqual(currentState, expectedState) : true,
      discrepancies: expectedState ? this.findDiscrepancies(expectedState, currentState) : []
    };

    this.stateSnapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.stateSnapshots.length > 1000) {
      this.stateSnapshots = this.stateSnapshots.slice(-1000);
    }

    activityLogger.log('system', 'state_snapshot', {
      component,
      isValid: snapshot.isValid,
      discrepancies: snapshot.discrepancies,
      stateSize: JSON.stringify(currentState).length
    });

    return snapshot;
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  private findDiscrepancies(expected: any, actual: any): string[] {
    const issues: string[] = [];
    
    if (typeof expected !== typeof actual) {
      issues.push(`Type mismatch: expected ${typeof expected}, got ${typeof actual}`);
      return issues;
    }

    if (typeof expected === 'object' && expected !== null) {
      for (const key in expected) {
        if (!(key in actual)) {
          issues.push(`Missing property: ${key}`);
        } else if (!this.deepEqual(expected[key], actual[key])) {
          issues.push(`Property mismatch: ${key}`);
        }
      }
    }

    return issues;
  }

  private sanitizeState(state: any): any {
    if (!state) return null;
    
    const sanitized = JSON.parse(JSON.stringify(state));
    
    // Remove sensitive data
    if (sanitized.password) delete sanitized.password;
    if (sanitized.token) delete sanitized.token;
    if (sanitized.apiKey) delete sanitized.apiKey;
    
    return sanitized;
  }

  // Get UI interaction failures
  getUIFailures(): UIInteractionLog[] {
    return this.uiInteractions.filter(interaction => !interaction.success);
  }

  // Get state validation issues
  getStateIssues(): StateSnapshot[] {
    return this.stateSnapshots.filter(snapshot => !snapshot.isValid);
  }

  // Export validation report
  exportValidationReport() {
    return {
      summary: {
        totalInteractions: this.uiInteractions.length,
        failedInteractions: this.getUIFailures().length,
        successRate: (this.uiInteractions.length - this.getUIFailures().length) / this.uiInteractions.length * 100,
        averageResponseTime: this.uiInteractions.reduce((sum, i) => sum + i.stateChangeDelay, 0) / this.uiInteractions.length,
        totalStateSnapshots: this.stateSnapshots.length,
        stateIssues: this.getStateIssues().length
      },
      failures: this.getUIFailures(),
      stateIssues: this.getStateIssues(),
      recentInteractions: this.uiInteractions.slice(-50)
    };
  }
}

export const stateValidator = new StateValidationLogger();