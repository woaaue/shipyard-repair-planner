import { 
  LayoutDashboard, 
  Ship, 
  Wrench, 
  Calendar,
  FileText,
  Settings,
  LogOut,
  X,
  Users,
  ClipboardList,
  Anchor
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const getNavigation = () => {
    const items = [
      { name: 'Дашборд', href: '/', icon: LayoutDashboard, roles: ['admin', 'dispatcher', 'operator', 'master', 'worker', 'client'] },
      { name: 'Мой док', href: '/my-dock', icon: Anchor, roles: ['operator'] },
      { name: 'Суда', href: '/ships', icon: Ship, roles: ['admin', 'dispatcher', 'operator', 'master'] },
      { name: 'Ремонты', href: '/repairs', icon: Wrench, roles: ['admin', 'dispatcher', 'operator', 'master', 'client'] },
      { name: 'Мои задачи', href: '/tasks', icon: ClipboardList, roles: ['dispatcher', 'master', 'worker'] },
      { name: 'Календарь', href: '/calendar', icon: Calendar, roles: ['admin', 'dispatcher', 'operator', 'master'] },
      { name: 'Отчёты', href: '/reports', icon: FileText, roles: ['admin', 'dispatcher', 'operator', 'master'] },
      { name: 'Пользователи', href: '/users', icon: Users, roles: ['admin'] },
      { name: 'Настройки', href: '/settings', icon: Settings, roles: ['admin'] },
    ];

    if (!user) return [];

    return items.filter(item => item.roles.includes(user.role));
  };

  const navigation = getNavigation();

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-6 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Ship className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Док-План</h1>
            <p className="text-sm text-gray-400">Судоремонт</p>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024 && onClose) {
                    onClose();
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800 flex-shrink-0">
        <button 
          onClick={() => {
            handleLogout();
            if (window.innerWidth < 1024 && onClose) {
              onClose();
            }
          }}
          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}