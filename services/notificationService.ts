/**
 * Neural Nudge Service
 * Handles Haptic Feedback and System Notifications
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

const analytics = {
  track: (event: string, data: any) => {
    console.log(`[Analytics] ${event}`, data);
  }
};

interface UserPattern {
  activeHours: { start: number; end: number };
  quietHours: { start: number; end: number };
  lastActivity: number;
  engagementScore: number;
}

class SmartScheduler {
  private pattern: UserPattern = {
    activeHours: { start: 9, end: 17 },
    quietHours: { start: 22, end: 7 },
    lastActivity: Date.now(),
    engagementScore: 0.5
  };

  updateActivity() {
    this.pattern.lastActivity = Date.now();
    this.pattern.engagementScore = Math.min(1, this.pattern.engagementScore + 0.1);
  }

  isQuietTime(): boolean {
    const hour = new Date().getHours();
    const { start, end } = this.pattern.quietHours;
    return start > end ? (hour >= start || hour < end) : (hour >= start && hour < end);
  }

  getOptimalDelay(): number {
    if (this.isQuietTime()) return 8 * 60 * 60 * 1000; // 8 hours
    
    const timeSinceActivity = Date.now() - this.pattern.lastActivity;
    const baseDelay = 5 * 60 * 1000; // 5 minutes
    
    if (timeSinceActivity < 2 * 60 * 1000) return baseDelay * 3; // Recently active, wait longer
    if (timeSinceActivity > 30 * 60 * 1000) return baseDelay; // Been away, notify sooner
    
    return baseDelay * 2;
  }
}

const scheduler = new SmartScheduler();

export const registerPushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== 'granted') {
      console.warn('Push notification permission denied');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token: Token) => {
      analytics.track('push_token_registered', { token: token.value });
      console.log('Push registration success, token: ' + token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      analytics.track('push_registration_error', { error: error.error });
      console.error('Push registration error: ', error.error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      analytics.track('push_received', { 
        title: notification.title,
        body: notification.body,
        id: notification.id 
      });
      console.log('Push notification received: ', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      analytics.track('push_action', { 
        actionId: action.actionId,
        notificationId: action.notification.id 
      });
      console.log('Push notification action performed: ', action.actionId);
    });

  } catch (error) {
    console.warn('Push notification registration failed:', error);
    analytics.track('push_registration_failed', { error });
  }
};

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning') => {
  scheduler.updateActivity(); // Track user interaction
  
  if (Capacitor.isNativePlatform()) {
    switch (type) {
      case 'light':
        void Haptics.impact({ style: ImpactStyle.Light });
        return;
      case 'medium':
        void Haptics.impact({ style: ImpactStyle.Medium });
        return;
      case 'heavy':
        void Haptics.impact({ style: ImpactStyle.Heavy });
        return;
      case 'success':
        void Haptics.notification({ type: NotificationType.Success });
        return;
      case 'warning':
        void Haptics.notification({ type: NotificationType.Warning });
        return;
    }
  }

  if (!('vibrate' in navigator)) return;

  switch (type) {
    case 'light':
      navigator.vibrate(10);
      break;
    case 'medium':
      navigator.vibrate(30);
      break;
    case 'heavy':
      navigator.vibrate(60);
      break;
    case 'success':
      navigator.vibrate([20, 40, 20]);
      break;
    case 'warning':
      navigator.vibrate([100, 50, 100]);
      break;
  }
};

export const requestNotificationPermission = async () => {
  if (Capacitor.isNativePlatform()) {
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === 'granted';
  }

  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendNudge = async (
  title: string,
  body: string,
  opts?: { delayMs?: number; at?: Date; smart?: boolean }
): Promise<boolean> => {
  let delayMs = opts?.delayMs ?? 500;
  
  if (opts?.smart !== false) {
    scheduler.updateActivity();
    const smartDelay = scheduler.getOptimalDelay();
    delayMs = Math.max(delayMs, smartDelay);
    
    analytics.track('smart_nudge_scheduled', {
      originalDelay: opts?.delayMs ?? 500,
      smartDelay,
      finalDelay: delayMs,
      isQuietTime: scheduler.isQuietTime()
    });
  }
  
  const scheduledAt = opts?.at ?? new Date(Date.now() + delayMs);

  if (Capacitor.isNativePlatform()) {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return false;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000),
          title,
          body,
          schedule: { at: scheduledAt },
        },
      ],
    });
    return true;
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') return false;

  try {
    if (delayMs > 0) {
      return new Promise(resolve => {
        window.setTimeout(() => {
          try {
            new Notification(title, { body, icon: '/favicon.ico' });
            resolve(true);
          } catch {
            resolve(false);
          }
        }, delayMs);
      });
    } else {
      new Notification(title, { body, icon: '/favicon.ico' });
      return true;
    }
  } catch {
    return false;
  }
};
export const setQuietHours = (start: number, end: number) => {
  scheduler['pattern'].quietHours = { start, end };
  analytics.track('quiet_hours_updated', { start, end });
};

export const getNotificationStats = () => ({
  isQuietTime: scheduler.isQuietTime(),
  nextOptimalDelay: scheduler.getOptimalDelay(),
  lastActivity: scheduler['pattern'].lastActivity,
  engagementScore: scheduler['pattern'].engagementScore
});