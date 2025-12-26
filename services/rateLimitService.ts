// Enterprise-Grade Rate Limiting & Temporal Controls
import { securityService } from './securityService';
interface RateLimitConfig {
  maxNotifications: number;
  timeWindow: number; // in milliseconds
  cooldownPeriod: number; // minimum time between notifications
  backoffMultiplier: number;
}

interface NotificationAttempt {
  timestamp: number;
  type: 'intervention' | 'contextual' | 'motivational';
  success: boolean;
}

class RateLimitService {
  private attempts: NotificationAttempt[] = [];
  private lastNotificationTime: number = 0;
  private consecutiveFailures: number = 0;
  
  private config: RateLimitConfig = {
    maxNotifications: 3, // Max 3 notifications per hour
    timeWindow: 60 * 60 * 1000, // 1 hour window
    cooldownPeriod: 15 * 60 * 1000, // 15 minutes minimum between notifications
    backoffMultiplier: 2 // Exponential backoff on failures
  };

  constructor() {
    this.loadState();
  }

  private loadState() {
    const stored = securityService.safeLocalStorageGet('curvycloud_rate_limit_state');
    if (stored) {
      try {
        const state = JSON.parse(stored);
        this.attempts = state.attempts || [];
        this.lastNotificationTime = state.lastNotificationTime || 0;
        this.consecutiveFailures = state.consecutiveFailures || 0;
        
        // Clean old attempts (older than 24 hours)
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.attempts = this.attempts.filter(a => a.timestamp > dayAgo);
      } catch (e) {
        // Reset all state on parse error
        this.attempts = [];
        this.lastNotificationTime = 0;
        this.consecutiveFailures = 0;
      }
    }
  }

  private saveState() {
    const state = {
      attempts: this.attempts.slice(-50),
      lastNotificationTime: this.lastNotificationTime,
      consecutiveFailures: this.consecutiveFailures
    };
    
    try {
      securityService.safeLocalStorageSet('curvycloud_rate_limit_state', JSON.stringify(state));
    } catch (error) {
      console.warn('[Rate Limit] Failed to save state:', securityService.sanitizeForLogging(String(error)));
    }
  }

  canSendNotification(type: 'intervention' | 'contextual' | 'motivational'): boolean {
    const now = Date.now();
    
    // Check cooldown period with SAFE maximum
    const timeSinceLastNotification = now - this.lastNotificationTime;
    const baseCooldown = this.config.cooldownPeriod;
    const backoffMultiplier = Math.min(this.consecutiveFailures, 3); // Cap at 3 failures
    const requiredCooldown = Math.min(baseCooldown * Math.pow(2, backoffMultiplier), 30 * 60 * 1000); // Max 30 minutes
    
    if (timeSinceLastNotification < requiredCooldown) {
      console.log(`[Rate Limit] Cooldown active: ${Math.round((requiredCooldown - timeSinceLastNotification) / 1000)}s remaining`);
      return false;
    }

    // Check rate limit within time window
    const windowStart = now - this.config.timeWindow;
    const recentAttempts = this.attempts.filter(a => a.timestamp > windowStart && a.success);
    
    if (recentAttempts.length >= this.config.maxNotifications) {
      console.log(`[Rate Limit] Rate limit exceeded: ${recentAttempts.length}/${this.config.maxNotifications} in last hour`);
      return false;
    }

    // Special rules for different notification types
    if (type === 'intervention') {
      // Interventions have priority but still respect basic cooldown
      const interventionCooldown = 10 * 60 * 1000; // 10 minutes for interventions
      if (timeSinceLastNotification < interventionCooldown) {
        return false;
      }
    }

    return true;
  }

  recordNotificationAttempt(type: 'intervention' | 'contextual' | 'motivational', success: boolean) {
    const now = Date.now();
    
    this.attempts.push({
      timestamp: now,
      type: securityService.validateNotificationType(type),
      success
    });

    // Prevent memory leaks by limiting array size
    if (this.attempts.length > 100) {
      this.attempts = this.attempts.slice(-50);
    }

    // Clean old attempts (older than 24 hours)
    const dayAgo = now - 24 * 60 * 60 * 1000;
    this.attempts = this.attempts.filter(a => a.timestamp > dayAgo);

    if (success) {
      this.lastNotificationTime = now;
      this.consecutiveFailures = 0;
    } else {
      this.consecutiveFailures++;
    }

    this.saveState();
    
    console.log(`[Rate Limit] Recorded ${securityService.sanitizeForLogging(type)} notification: ${success ? 'success' : 'failed'}`);
  }

  getNextAllowedTime(): number {
    const now = Date.now();
    const timeSinceLastNotification = now - this.lastNotificationTime;
    const baseCooldown = this.config.cooldownPeriod;
    const backoffMultiplier = Math.min(this.consecutiveFailures, 3); // Cap at 3 failures
    const requiredCooldown = Math.min(baseCooldown * Math.pow(2, backoffMultiplier), 30 * 60 * 1000); // Max 30 minutes
    
    if (timeSinceLastNotification >= requiredCooldown) {
      return now; // Can send now
    }
    
    return this.lastNotificationTime + requiredCooldown;
  }

  getRateLimitStatus() {
    const now = Date.now();
    const windowStart = now - this.config.timeWindow;
    const recentAttempts = this.attempts.filter(a => a.timestamp > windowStart && a.success);
    const nextAllowedTime = this.getNextAllowedTime();
    
    return {
      notificationsInWindow: recentAttempts.length,
      maxNotifications: this.config.maxNotifications,
      cooldownActive: now < nextAllowedTime,
      nextAllowedTime,
      consecutiveFailures: this.consecutiveFailures,
      timeUntilNext: Math.max(0, nextAllowedTime - now)
    };
  }

  // Emergency override for critical notifications
  canSendEmergencyNotification(): boolean {
    const now = Date.now();
    const timeSinceLastNotification = now - this.lastNotificationTime;
    
    // Allow emergency notifications if it's been at least 5 minutes
    return timeSinceLastNotification >= 5 * 60 * 1000;
  }
}

export const rateLimitService = new RateLimitService();