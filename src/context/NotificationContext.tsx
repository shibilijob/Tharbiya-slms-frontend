import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '../types';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { useUiStore } from '../stores/uiStore';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  pushNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const toastMessage = useUiStore((state) => state.toastMessage);
  const showToast = useUiStore((state) => state.showToast);
  const clearToast = useUiStore((state) => state.clearToast);

  useEffect(() => {
    const load = async () => {
      if (user) {
        const userNotifs = await notificationService.getByUser(user.id);
        setNotifications(userNotifs);
      } else {
        setNotifications([]);
      }
    };
    load();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    if (user) {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const pushNotification = async (notifData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const created = await notificationService.addNotification(notifData);
    setNotifications(prev => [created, ...prev]);
    showToast(created.title);
  };


  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        pushNotification,
        toastMessage,
        showToast,
        clearToast
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
