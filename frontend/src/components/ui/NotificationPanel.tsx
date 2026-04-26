import { useEffect, useMemo, useState } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationResponse,
} from '../../services/notifications';

interface NotificationPanelProps {
  onClose?: () => void;
  onUnreadChange?: (count: number) => void;
}

const icons = {
  SUCCESS: <CheckCircle className="h-5 w-5 text-green-500" />,
  ERROR: <AlertCircle className="h-5 w-5 text-red-500" />,
  WARNING: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  INFO: <Info className="h-5 w-5 text-blue-500" />,
};

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationPanel({ onClose, onUnreadChange }: NotificationPanelProps) {
  const [list, setList] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = useMemo(() => list.filter((item) => !item.read).length, [list]);

  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [onUnreadChange, unreadCount]);

  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const data = await getNotifications(false);
        setList(data);
      } catch {
        setList([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const updated = await markNotificationAsRead(id);
      setList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      const updated = await markAllNotificationsAsRead();
      const updatedMap = new Map(updated.map((item) => [item.id, item]));
      setList((prev) => prev.map((item) => updatedMap.get(item.id) ?? item));
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-80 bg-white border-l shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold">Уведомления</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-2 border-b">
        <button onClick={() => void markAllAsRead()} className="text-sm text-blue-600 hover:underline" disabled={isLoading}>
          Отметить все как прочитанные
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Загрузка...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Нет уведомлений</div>
        ) : (
          list.map((item) => (
            <div
              key={item.id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${!item.read ? 'bg-blue-50' : ''}`}
              onClick={() => void markAsRead(item.id)}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">{icons[item.type]}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item.title}</span>
                    <span className="text-xs text-gray-500">{formatTime(item.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
