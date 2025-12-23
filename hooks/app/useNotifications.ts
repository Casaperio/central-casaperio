import { useState, useCallback } from 'react';
import { generateId } from '../../utils';
import type { SystemNotification } from '../../components/layout/NotificationCenter';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const addNotification = useCallback(
    (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      setNotifications(prev => [{
        id: generateId(),
        title,
        message,
        type,
        timestamp: Date.now(),
        read: false
      }, ...prev]);
    },
    []
  );

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => !prev);
  }, []);

  return {
    notifications,
    showNotifications,
    addNotification,
    markAllRead,
    clearNotifications,
    toggleNotifications,
  };
};
