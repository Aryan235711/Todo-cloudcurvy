/**
 * Accessible Notification Banner Component
 * WCAG 2.1 Level AA compliant notification display
 */

import { useEffect, useRef, useState } from 'react';

export interface NotificationProps {
  id: string;
  title: string;
  body: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'motivational';
  priority?: 'low' | 'medium' | 'high';
  onDismiss?: (id: string) => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

export const AccessibleNotification = ({
  id,
  title,
  body,
  type,
  priority = 'medium',
  onDismiss,
  autoDismiss = true,
  autoDismissDelay = 5000
}: NotificationProps) => {
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-dismiss for non-critical notifications
    if (autoDismiss && priority !== 'high') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissDelay);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, autoDismissDelay, priority]);

  useEffect(() => {
    // Focus notification for screen readers on mount if high priority
    if (priority === 'high' && notificationRef.current) {
      notificationRef.current.focus();
    }
  }, [priority]);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to dismiss
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(id);
    }
  };

  // Type-specific styling and icons
  const typeConfig = {
    success: {
      icon: '✓',
      bgClass: 'bg-green-50 border-green-500',
      textClass: 'text-green-900',
      iconClass: 'text-green-600',
      ariaLabel: 'Success notification'
    },
    info: {
      icon: 'ℹ',
      bgClass: 'bg-blue-50 border-blue-500',
      textClass: 'text-blue-900',
      iconClass: 'text-blue-600',
      ariaLabel: 'Information notification'
    },
    warning: {
      icon: '⚠',
      bgClass: 'bg-yellow-50 border-yellow-500',
      textClass: 'text-yellow-900',
      iconClass: 'text-yellow-600',
      ariaLabel: 'Warning notification'
    },
    error: {
      icon: '✕',
      bgClass: 'bg-red-50 border-red-500',
      textClass: 'text-red-900',
      iconClass: 'text-red-600',
      ariaLabel: 'Error notification'
    },
    motivational: {
      icon: '🚀',
      bgClass: 'bg-purple-50 border-purple-500',
      textClass: 'text-purple-900',
      iconClass: 'text-purple-600',
      ariaLabel: 'Motivational notification'
    }
  };

  const config = typeConfig[type];

  // ARIA live region assertiveness based on priority
  const ariaLive = priority === 'high' ? 'assertive' : 'polite';
  
  return (
    <div
      ref={notificationRef}
      role="alert"
      aria-live={ariaLive}
      aria-atomic="true"
      aria-labelledby={`notification-title-${id}`}
      aria-describedby={`notification-body-${id}`}
      tabIndex={0}
      className={`
        relative p-4 rounded-lg border-l-4 shadow-lg
        ${config.bgClass} ${config.textClass}
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type === 'motivational' ? 'purple' : type}-500
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span 
          className={`text-xl ${config.iconClass}`}
          aria-hidden="true"
        >
          {config.icon}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 
            id={`notification-title-${id}`}
            className="font-semibold text-sm mb-1"
          >
            {title}
          </h3>
          <p 
            id={`notification-body-${id}`}
            className="text-sm opacity-90"
          >
            {body}
          </p>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            aria-label={`Dismiss ${config.ariaLabel.toLowerCase()}`}
            className={`
              ml-2 p-1 rounded hover:bg-black/10 
              focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current
              transition-colors
            `}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </button>
        )}
      </div>

      {/* Visual indicator for screen reader users that notification is dismissible with Escape */}
      <div className="sr-only">
        Press Escape to dismiss this notification
      </div>
    </div>
  );
};

/**
 * Notification Container with ARIA live region
 * Manages multiple notifications with stacking
 */
export const NotificationContainer = ({ 
  notifications,
  onDismiss,
  position = 'top-right'
}: {
  notifications: NotificationProps[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2'
  };

  return (
    <div 
      className={`
        fixed ${positionClasses[position]} 
        z-50 w-full max-w-md space-y-2
        pointer-events-none
      `}
      aria-label="Notifications"
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <AccessibleNotification
            {...notification}
            onDismiss={onDismiss}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Hook for managing accessible notifications
 */
export const useAccessibleNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = (
    title: string,
    body: string,
    type: NotificationProps['type'] = 'info',
    priority: NotificationProps['priority'] = 'medium'
  ) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification: NotificationProps = {
      id,
      title,
      body,
      type,
      priority
    };

    setNotifications(prev => [...prev, notification]);
    
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll
  };
};
