/**
 * 🍞 TOAST NOTIFICATION COMPONENT
 * 
 * Toast que aparece no canto superior direito por 7 segundos
 * Usa position: fixed para ficar sobreposto a tudo
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ToastNotification } from '../utils/notificationToastHelpers';

interface ToastProps {
  notification: ToastNotification;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Auto-close após 7 segundos
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300); // Aguardar animação de saída
    }, 7000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const bgColor = notification.type === 'reservation' 
    ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
    : 'bg-gradient-to-r from-orange-500 to-amber-600';

  return (
    <div
      className={`
        fixed top-4 right-4 z-[9999]
        max-w-md w-full
        ${bgColor}
        text-white
        rounded-lg shadow-2xl
        p-4
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'}
      `}
      style={{
        animation: isExiting ? 'none' : 'slideInRight 0.3s ease-out',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold pr-8 leading-tight">
          {notification.title}
        </h3>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Fechar notificação"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message */}
      <div className="text-sm whitespace-pre-line leading-relaxed">
        {notification.message}
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white rounded-full"
          style={{
            animation: 'shrink 7s linear forwards',
          }}
        />
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Container para gerenciar múltiplos toasts
 */
interface ToastContainerProps {
  notifications: ToastNotification[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ notifications, onRemove }) => {
  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            top: `${1 + index * 0.5}rem`, // Empilhar toasts
            zIndex: 9999 - index,
          }}
        >
          <Toast
            notification={notification}
            onClose={() => onRemove(notification.id)}
          />
        </div>
      ))}
    </>
  );
};
