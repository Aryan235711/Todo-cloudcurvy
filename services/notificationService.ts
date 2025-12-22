
/**
 * 201 IQ Neural Nudge Service
 * Handles Haptic Feedback and System Notifications
 */

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning') => {
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
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendNudge = (title: string, body: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  new Notification(title, {
    body,
    icon: '/favicon.ico', // Placeholder for actual icon
  });
};
