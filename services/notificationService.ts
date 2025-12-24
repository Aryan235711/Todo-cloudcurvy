
/**
 * Neural Nudge Service
 * Handles Haptic Feedback and System Notifications
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

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
            new Notification(title, {
              body,
              icon: '/favicon.ico',
            });
            resolve(true);
          } catch {
            resolve(false);
          }
        }, delayMs);
      });
    } else {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
      return true;
    }
  } catch {
    return false;
  }
};
