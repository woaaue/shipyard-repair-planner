import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { getNotifications } from '../../services/notifications';
import SearchResults from '../ui/SearchResults';
import NotificationPanel from '../ui/NotificationPanel';
import { ROLE_UI_LABELS } from '../../constants/labels';

interface HeaderProps {
  children?: React.ReactNode;
}

export default function Header({ children }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { query, results, isSearching, search, clearSearch } = useGlobalSearch();
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    void getNotifications(true)
      .then((items) => setUnreadCount(items.length))
      .catch(() => setUnreadCount(0));
  }, []);

  const getRoleLabel = (role: string) => {
    return ROLE_UI_LABELS[role as keyof typeof ROLE_UI_LABELS] ?? 'Пользователь';
  };

  const getRoleDetails = () => {
    if (!user) return '';
    
    switch(user.role) {
      case 'operator': return user.dock ? `(${user.dock})` : '';
      case 'client': return user.shipId ? `(Судно #${user.shipId})` : '';
      default: return '';
    }
  };

  const handleSelect = (type: string, id: number) => {
    const result = results.find(r => r.type === type && r.id === id);
    if (result) {
      navigate(result.url);
      clearSearch();
      setShowResults(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b px-4 lg:px-6 py-4 border-[var(--line)] bg-[rgba(255,255,255,0.94)] backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 max-w-xl gap-4">
          {children}
          
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)] h-5 w-5" />
              
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  search(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                placeholder="Поиск по судам, ремонтам..."
                className="w-full pl-10 pr-10 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              />
              
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearSearch();
                    setShowResults(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)] hover:text-[var(--blue)]"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            {showResults && query.length >= 2 && (
              <SearchResults 
                query={query} 
                results={results}
                isSearching={isSearching}
                onClose={() => setShowResults(false)}
                onSelect={handleSelect}
              />
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--soft)] rounded-lg"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] rounded-md flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2">
                <NotificationPanel
                  onClose={() => setShowNotifications(false)}
                  onUnreadChange={setUnreadCount}
                />
              </div>
            )}
          </div>

              <div className="hidden lg:block h-8 w-px bg-[var(--line)]"></div>

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden lg:flex items-center space-x-3">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${
                  user.role === 'admin' ? 'bg-blue-100 text-blue-600' :
                  user.role === 'operator' ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {user.avatar ? (
                    <span className="text-lg">{user.avatar}</span>
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-[var(--ink)]">{user.fullName}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {getRoleLabel(user.role)} {getRoleDetails()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex items-center space-x-3">
              <div className="h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-[var(--ink)]">Не авторизован</p>
                <p className="text-sm text-[var(--muted)]">Войдите в систему</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
