import { Outlet, NavLink } from 'react-router-dom';
import { Ship, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Главная', href: '/', roles: ['admin', 'dispatcher', 'operator', 'master', 'worker', 'client'] },
    { name: 'Ремонты', href: '/repairs', roles: ['admin', 'dispatcher', 'operator', 'master', 'client'] },
    { name: 'Мои заявки', href: '/my-requests', roles: ['client'] },
    { name: 'Заявки', href: '/requests', roles: ['dispatcher'] },
    { name: 'Задачи', href: '/tasks', roles: ['dispatcher', 'master', 'worker'] },
    { name: 'Мой док', href: '/my-dock', roles: ['operator'] },
    { name: 'Суда', href: '/ships', roles: ['admin', 'dispatcher', 'operator', 'client'] },
    { name: 'Календарь', href: '/calendar', roles: ['admin', 'dispatcher', 'operator', 'master'] },
    { name: 'Отчеты', href: '/reports', roles: ['admin', 'dispatcher', 'operator', 'master'] },
    { name: 'Пользователи', href: '/users', roles: ['admin'] },
    { name: 'Журнал изменений', href: '/audit', roles: ['admin'] },
    { name: 'Настройки', href: '/settings', roles: ['admin'] },
  ].filter((item) => (user ? item.roles.includes(user.role) : false));

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(255,255,255,0.94)] backdrop-blur-sm">
        <div className="grid gap-3 px-4 py-3 lg:px-6 lg:grid-cols-[240px_minmax(0,1fr)_auto] lg:items-center">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-[8px] bg-[var(--nav)] text-white grid place-items-center">
              <Ship className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--ink)]">Док-План</div>
              <div className="text-xs text-[var(--muted)]">Планирование судоремонта</div>
            </div>
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto pb-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `inline-flex min-h-[36px] items-center rounded-[7px] px-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[var(--nav)] text-white'
                      : 'text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <div className="text-right">
              <div className="text-sm font-semibold text-[var(--ink)]">{user?.fullName ?? 'Пользователь'}</div>
              <div className="text-xs text-[var(--muted)]">{user?.role ?? ''}</div>
            </div>
            <button
              onClick={() => void logout()}
              className="inline-flex min-h-[36px] items-center gap-2 rounded-[7px] border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--soft)]"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-[min(1260px,calc(100%-40px))] py-5 flex-1">
        <Outlet />
      </main>

    </div>
  );
}
