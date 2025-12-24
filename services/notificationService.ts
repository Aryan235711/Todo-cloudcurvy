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
  opts?: { delayMs?: number; at?: Date }
): Promise<boolean> => {
  const delayMs = Math.max(0, opts?.delayMs ?? 500);
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