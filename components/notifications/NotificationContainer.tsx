'use client';

import React from 'react';
import { useNotifications } from './NotificationContext';
import NotificationComponent from './Notification';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <>
      {notifications.map(notification => (
        <NotificationComponent
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </>
  );
};

export default NotificationContainer;