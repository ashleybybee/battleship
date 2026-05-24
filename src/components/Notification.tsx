import { useEffect } from 'react';
import type { Notification as NotificationType } from '../types';

interface NotificationProps {
  notification: NotificationType;
  onDismiss: (id: number) => void;
}

export default function NotificationToast({ notification, onDismiss }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const bgColor =
    notification.type === 'win'
      ? 'from-emerald-600 to-emerald-700 border-emerald-400/50'
      : notification.type === 'loss'
        ? 'from-red-600 to-red-700 border-red-400/50'
        : 'from-orange-600 to-orange-700 border-orange-400/50';

  return (
    <div
      className={`bg-gradient-to-r ${bgColor} border rounded-lg px-5 py-3 shadow-2xl animate-slide-in text-white font-semibold text-sm`}
    >
      {notification.message}
    </div>
  );
}
