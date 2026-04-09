'use client';

import React from 'react';
import { Notification, NotificationType, NotificationData } from './NotificationContext';

interface NotificationComponentProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const NotificationComponent: React.FC<NotificationComponentProps> = ({ notification, onClose }) => {
  const renderContent = () => {
    switch (notification.type) {
      case 'product_added':
        return `Se creó el producto "${(notification.data as NotificationData['product_added']).productName}"`;
      case 'product_removed':
        return `Se eliminó el producto "${(notification.data as NotificationData['product_removed']).productName}"`;
      case 'product_edited':
        const editedData = notification.data as NotificationData['product_edited'];
        return (
          <div>
            <div>Se editó el producto "{editedData.productName}"</div>
            <ul>
              {editedData.changes.map((change, index) => (
                <li key={index}>{change.field}: {change.before} → {change.after}</li>
              ))}
            </ul>
          </div>
        );
      case 'offer_created':
        const createdData = notification.data as NotificationData['offer_created'];
        return (
          <div>
            <div>Se creó la oferta "{createdData.name}"</div>
            <div>Productos: {createdData.products.join(', ')}</div>
            <div>Expira: {createdData.expiryDate}</div>
          </div>
        );
      case 'offer_expired':
        const expiredData = notification.data as NotificationData['offer_expired'];
        return `La oferta "${expiredData.name}" expiró. Ventas realizadas: ${expiredData.salesCount}`;
      case 'sale':
        const saleData = notification.data as NotificationData['sale'];
        if (saleData.products && saleData.products.length <= 2) {
          return (
            <div>
              <div>Venta realizada:</div>
              <ul>
                {saleData.products.map((product, index) => (
                  <li key={index}>{product.name}: {product.quantity}</li>
                ))}
              </ul>
              <div>Total: ${saleData.total}</div>
            </div>
          );
        } else {
          return `Venta realizada. Total: $${saleData.total}`;
        }
      case 'cash_closed':
        return 'Caja cerrada';
      default:
        return 'Notificación';
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#4CAF50', // Verde
        color: 'white',
        padding: '15px 20px',
        borderRadius: '50px', // Muy redondeado, casi circular
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        maxWidth: '100%',
        textAlign: 'left',
        fontSize: '14px',
      }}
    >
      <button
        onClick={(event) => {
          event.stopPropagation();
          onClose(notification.id);
        }}
        style={{
          position: 'absolute',
          top: '8px',
          right: '12px',
          border: 'none',
          background: 'rgba(255,255,255,0.25)',
          color: 'white',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontWeight: '700',
          lineHeight: '18px',
        }}
      >
        ×
      </button>
      {renderContent()}
    </div>
  );
};

export default NotificationComponent;