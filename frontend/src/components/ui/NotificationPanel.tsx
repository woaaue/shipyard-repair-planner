import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationPanelProps {
  notifications?: Notification[];
  onClose?: () => void;
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'info', title: 'Ремонт начат', message: 'Ремонт судна "Анна Мария" начат', time: '10:30', read: false },
  { id: '2', type: 'warning', title: 'Задержка', message: 'Ремонт "Урал" отстаёт от графика', time: '09:15', read: false },
  { id: '3', type: 'success', title: 'Ремонт завершён', message: 'Ремонт "Балтика" завершён', time: 'Вчера', read: true },
];

const icons = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />
};

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [list, setList] = useState(mockNotifications);
  const unreadCount = list.filter(n => !n.read).length;
  
  const markAsRead = (id: string) => {
    setList(list.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const markAllAsRead = () => {
    setList(list.map(n => ({ ...n, read: true })));
  };
  
  return (
    <div className="w-80 bg-white border-l shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold">Уведомления</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="p-2 border-b">
        <button 
          onClick={markAllAsRead}
          className="text-sm text-blue-600 hover:underline"
        >
          Отметить все как прочитанные
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {list.map(n => (
          <div 
            key={n.id}
            className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}`}
            onClick={() => markAsRead(n.id)}
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">{icons[n.type]}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{n.title}</span>
                  <span className="text-xs text-gray-500">{n.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{n.message}</p>
              </div>
            </div>
          </div>
        ))}
        
        {list.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Нет уведомлений
          </div>
        )}
      </div>
    </div>
  );
}