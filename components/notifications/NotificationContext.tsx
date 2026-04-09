'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const STORAGE_KEY = 'easyStockNotifications';

export type NotificationType =
  | 'product_added'
  | 'product_removed'
  | 'product_edited'
  | 'offer_created'
  | 'offer_expired'
  | 'sale'
  | 'cash_closed';

export interface NotificationData {
  product_added: { productName: string };
  product_removed: { productName: string };
  product_edited: { productName: string; changes: { field: string; before: string; after: string }[] };
  offer_created: { name: string; products: string[]; expiryDate: string };
  offer_expired: { name: string; salesCount: number };
  sale: { products?: { name: string; quantity: number }[]; total: number };
  cash_closed: {};
}

export interface Notification<T extends NotificationType = NotificationType> {
  id: string;
  type: T;
  data: NotificationData[T];
  timestamp: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: <T extends NotificationType>(type: T, data: NotificationData[T]) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const loadNotifications = (): Notification[] => {
  if (typeof window === 'undefined') return [];
  try {
    const item = sessionStorage.getItem(STORAGE_KEY);
    return item ? (JSON.parse(item) as Notification[]) : [];
  } catch {
    return [];
  }
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setNotifications(loadNotifications());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = <T extends NotificationType>(type: T, data: NotificationData[T]) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const notification: Notification<T> = {
      id,
      type,
      data,
      timestamp: Date.now(),
    };
    setNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};