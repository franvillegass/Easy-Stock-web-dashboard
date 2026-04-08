'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = <T extends NotificationType>(type: T, data: NotificationData[T]) => {
    const id = Date.now().toString();
    const notification: Notification<T> = {
      id,
      type,
      data,
      timestamp: Date.now(),
    };
    setNotifications(prev => [...prev, notification]);
    // Auto-remove after 5 seconds
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};