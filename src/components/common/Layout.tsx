import React, { useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  Squares2X2Icon,
  FireIcon,
  PencilSquareIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationService } from '../../services/notifications.service';

const linkBase =
  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors';

const Layout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const service = NotificationService.getInstance();
    service.initialize();
    return () => service.cleanup();
  }, []);

  const links = useMemo(
    () => [
      { to: '/dashboard', label: 'Дашборд', icon: HomeIcon },
      { to: '/tasks', label: 'Задачи', icon: ClipboardDocumentListIcon },
      { to: '/projects', label: 'Проекты', icon: Squares2X2Icon },
      { to: '/habits', label: 'Привычки', icon: FireIcon },
      { to: '/notes', label: 'Заметки', icon: PencilSquareIcon },
      { to: '/statistics', label: 'Статистика', icon: ChartBarIcon },
      { to: '/settings', label: 'Настройки', icon: Cog6ToothIcon }
    ],
    []
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-72 border-r border-slate-800 bg-slate-950/95 p-6 hidden lg:flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500" />
            <div>
              <p className="text-lg font-semibold">ДИСЦИПЛИНА</p>
              <p className="text-xs text-slate-400">личный трекер</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `${linkBase} ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`
                }
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
            >
              Тема: {theme === 'dark' ? 'темная' : 'светлая'}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4" />
              Выйти
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/90">
            <div>
              <p className="text-sm text-slate-400">Добро пожаловать,</p>
              <h1 className="text-xl font-semibold text-white">{profile?.username || 'Пользователь'}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="relative rounded-full border border-slate-800 p-2 text-slate-300 hover:bg-slate-900"
                title="Уведомления"
              >
                <BellIcon className="h-5 w-5" />
              </button>
              <div className="hidden md:flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm text-slate-200">
                <span className="h-2 w-2 rounded-full bg-secondary-400" />
                {profile?.timezone || 'Europe/Moscow'}
              </div>
            </div>
          </header>

          <main className="flex-1 bg-slate-950 px-6 py-6">
            <Outlet />
          </main>
          <nav className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 py-2">
            <div className="flex items-center justify-between">
              {links.slice(0, 5).map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 text-xs ${isActive ? 'text-primary-300' : 'text-slate-400'}`
                  }
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Layout;
