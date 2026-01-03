/**
 * Notification Queue Service
 * Handles offline notification queuing and exponential backoff for rate limiting
 */

import { RATE_LIMIT_CONFIG } from '../config/notificationConstants';

interface QueuedNotification {
  id: string;
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  context?: any;
  attempts: number;
  nextRetryAt: number;
  createdAt: number;
  type: 'motivational' | 'intervention' | 'contextual';
}

interface BackoffStrategy {
  baseDelay: number;
  maxDelay: number;
  multiplier: number;
  maxAttempts: number;
}

class NotificationQueueService {
  private queue: QueuedNotification[] = [];
  private storageKey = 'loop_notification_queue';
  private processingTimer: NodeJS.Timeout | number | null = null;
  private isOnline = navigator.onLine;
  
  private backoffStrategy: BackoffStrategy = {
    baseDelay: RATE_LIMIT_CONFIG.BASE_BACKOFF_MS,
    maxDelay: RATE_LIMIT_CONFIG.MAX_BACKOFF_MS,
    multiplier: RATE_LIMIT_CONFIG.BACKOFF_MULTIPLIER,
    maxAttempts: 5
  };

  constructor() {
    this.loadQueue();
    this.setupOnlineListener();
    this.startQueueProcessor();
  }

  /**
   * Add notification to queue with priority
   */
  enqueue(
    title: string,
    body: string,
    type: 'motivational' | 'intervention' | 'contextual',
    priority: 'low' | 'medium' | 'high' = 'medium',
    context?: any
  ): string {
    const notification: QueuedNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      body,
      priority,
      context,
      attempts: 0,
      nextRetryAt: Date.now(),
      createdAt: Date.now(),
      type
    };

    // Insert based on priority (high first)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const insertIndex = this.queue.findIndex(
      n => priorityOrder[n.priority] > priorityOrder[priority]
    );

    if (insertIndex === -1) {
      this.queue.push(notification);
    } else {
      this.queue.splice(insertIndex, 0, notification);
    }

    this.saveQueue();
    console.log(`[NotificationQueue] Enqueued ${type} notification (priority: ${priority})`);
    
    return notification.id;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempts: number): number {
    const delay = Math.min(
      this.backoffStrategy.baseDelay * Math.pow(this.backoffStrategy.multiplier, attempts),
      this.backoffStrategy.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitter = delay * 0.1 * Math.random();
    return delay + jitter;
  }

  /**
   * Process queue - send ready notifications
   */
  private async processQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    const now = Date.now();
    const readyNotifications = this.queue.filter(
      n => n.nextRetryAt <= now && n.attempts < this.backoffStrategy.maxAttempts
    );

    for (const notification of readyNotifications) {
      try {
        // Dynamic import to avoid circular dependency
        const { sendNudge } = await import('./notificationService');
        
        const success = await sendNudge(notification.title, notification.body, {
          smart: true,
          context: notification.context
        });

        if (success) {
          // Remove from queue on success
          this.removeFromQueue(notification.id);
          console.log(`[NotificationQueue] Successfully sent ${notification.type}`);
        } else {
          // Update for retry with exponential backoff
          notification.attempts++;
          notification.nextRetryAt = now + this.calculateBackoff(notification.attempts);
          
          if (notification.attempts >= this.backoffStrategy.maxAttempts) {
            console.warn(`[NotificationQueue] Max attempts reached for ${notification.id}, removing`);
            this.removeFromQueue(notification.id);
          } else {
            console.log(`[NotificationQueue] Retry scheduled for ${notification.id} in ${((notification.nextRetryAt - now) / 1000).toFixed(0)}s`);
            this.saveQueue();
          }
        }
      } catch (error) {
        console.error(`[NotificationQueue] Error processing ${notification.id}:`, error);
        notification.attempts++;
        notification.nextRetryAt = now + this.calculateBackoff(notification.attempts);
        
        if (notification.attempts >= this.backoffStrategy.maxAttempts) {
          this.removeFromQueue(notification.id);
        } else {
          this.saveQueue();
        }
      }
    }

    // Clean up old notifications (> 24 hours)
    const cutoff = now - (24 * 60 * 60 * 1000);
    this.queue = this.queue.filter(n => n.createdAt > cutoff);
    this.saveQueue();
  }

  /**
   * Remove notification from queue
   */
  private removeFromQueue(id: string): void {
    this.queue = this.queue.filter(n => n.id !== id);
    this.saveQueue();
  }

  /**
   * Start periodic queue processor
   */
  private startQueueProcessor(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer as number);
    }

    // Process queue periodically
    this.processingTimer = setInterval(() => {
      this.processQueue();
    }, RATE_LIMIT_CONFIG.QUEUE_PROCESS_INTERVAL_MS);

    // Process immediately
    this.processQueue();
  }

  /**
   * Setup online/offline listener
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('[NotificationQueue] Connection restored, processing queue');
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      console.log('[NotificationQueue] Connection lost, queuing notifications');
      this.isOnline = false;
    });
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[NotificationQueue] Loaded ${this.queue.length} queued notifications`);
      }
    } catch (error) {
      console.warn('[NotificationQueue] Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.warn('[NotificationQueue] Failed to save queue:', error);
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    total: number;
    pending: number;
    failed: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
  } {
    const now = Date.now();
    return {
      total: this.queue.length,
      pending: this.queue.filter(n => n.nextRetryAt <= now).length,
      failed: this.queue.filter(n => n.attempts >= this.backoffStrategy.maxAttempts).length,
      byPriority: {
        high: this.queue.filter(n => n.priority === 'high').length,
        medium: this.queue.filter(n => n.priority === 'medium').length,
        low: this.queue.filter(n => n.priority === 'low').length
      },
      byType: {
        motivational: this.queue.filter(n => n.type === 'motivational').length,
        intervention: this.queue.filter(n => n.type === 'intervention').length,
        contextual: this.queue.filter(n => n.type === 'contextual').length
      }
    };
  }

  /**
   * Clear queue (for testing or user preference)
   */
  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
    console.log('[NotificationQueue] Queue cleared');
  }
}

export const notificationQueue = new NotificationQueueService();
