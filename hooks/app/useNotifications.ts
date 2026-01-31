import { useState, useCallback, useEffect } from 'react';
import { generateId } from '../../utils';
import type { SystemNotification } from '../../components/layout/NotificationCenter';
import { notificationsLogger } from '../../utils/logger';

const STORAGE_KEY = 'casape_notification_history';
const MAX_STORED = 50; // Limitar para não encher localStorage

export const useNotifications = () => {
  // Recuperar notificações do localStorage na inicialização
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      notificationsLogger.error('Erro ao recuperar notificações', error);
    }
    return [];
  });
  
  const [showNotifications, setShowNotifications] = useState(false);

  // Persistir no localStorage sempre que mudar
  useEffect(() => {
    try {
      // Manter apenas as últimas MAX_STORED
      const toStore = notifications.slice(0, MAX_STORED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      notificationsLogger.error('Erro ao persistir notificações', error);
    }
  }, [notifications]);

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
