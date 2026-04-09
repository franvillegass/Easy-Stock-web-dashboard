'use client';

import React from 'react';
import { useNotifications } from './NotificationContext';
import NotificationComponent from './Notification';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification, clearNotifications } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: 'min(95%, 600px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <button
          onClick={clearNotifications}
          style={{
            background: '#2E7D32',
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            padding: '8px 14px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Cerrar todas
        </button>
      </div>

      {notifications.map(notification => (
        <NotificationComponent
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;