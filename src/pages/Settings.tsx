import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useTheme } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
  const { profile, updateProfile, updateEmail, updatePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState(profile?.username || '');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [timezone, setTimezone] = useState(profile?.timezone || 'Europe/Moscow');
  const [notifications, setNotifications] = useState(profile?.email_notifications ?? true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username || '');
    setTimezone(profile.timezone || 'Europe/Moscow');
    setNotifications(profile.email_notifications ?? true);
  }, [profile]);

  const handleProfileSave = async () => {
    await updateProfile({
      username,
      timezone,
      email_notifications: notifications
    });
    setStatus('Профиль обновлен.');
  };

  const handleEmailSave = async () => {
    if (!email) return;
    await updateEmail(email);
    setStatus('Проверьте почту для подтверждения email.');
  };

  const handlePasswordSave = async () => {
    if (!newPassword) return;
    await updatePassword(newPassword);
    setNewPassword('');
    setStatus('Пароль обновлен.');
  };

  const handleExport = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const [tasks, projects, notes, habits] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('projects').select('*').eq('user_id', user.id),
      supabase.from('notes').select('*').eq('user_id', user.id),
      supabase.from('habit_logs').select('*')
    ]);

    const payload = {
      exported_at: new Date().toISOString(),
      tasks: tasks.data,
      projects: projects.data,
      notes: notes.data,
      habit_logs: habits.data
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'discipline-export.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold text-white">Настройки</h2>
        <p className="text-sm text-slate-400">Профиль, уведомления и экспорт данных.</p>
      </header>

      {status && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {status}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Профиль</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-300">Имя пользователя</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Часовой пояс</label>
            <input
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={notifications}
            onChange={(event) => setNotifications(event.target.checked)}
          />
          Email-уведомления
        </label>
        <button
          type="button"
          onClick={handleProfileSave}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-400"
        >
          Сохранить профиль
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Безопасность</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-300">Новый email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <button
              type="button"
              onClick={handleEmailSave}
              className="mt-2 rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
            >
              Обновить email
            </button>
          </div>
          <div>
            <label className="text-sm text-slate-300">Новый пароль</label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <button
              type="button"
              onClick={handlePasswordSave}
              className="mt-2 rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
            >
              Обновить пароль
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Внешний вид</h3>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`rounded-lg border px-4 py-2 text-sm ${
              theme === 'dark'
                ? 'border-primary-500/60 bg-primary-500/10 text-primary-200'
                : 'border-slate-800 text-slate-200'
            }`}
          >
            Темная тема
          </button>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`rounded-lg border px-4 py-2 text-sm ${
              theme === 'light'
                ? 'border-primary-500/60 bg-primary-500/10 text-primary-200'
                : 'border-slate-800 text-slate-200'
            }`}
          >
            Светлая тема
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Экспорт данных</h3>
        <p className="text-sm text-slate-400">Скачайте JSON архив всех данных.</p>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
        >
          Экспортировать данные
        </button>
      </section>
    </div>
  );
};

export default Settings;
