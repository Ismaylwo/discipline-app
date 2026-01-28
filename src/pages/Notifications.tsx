import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Tables } from '../types/database.types';

const Notifications: React.FC = () => {
  const [items, setItems] = useState<Tables<'notifications'>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setItems(data || []);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Уведомления</h2>
        <p className="text-sm text-slate-400">Все события и напоминания.</p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-950">
        {loading && <p className="p-6 text-slate-400">Загрузка уведомлений...</p>}
        {!loading && items.length === 0 && <p className="p-6 text-slate-400">Нет уведомлений.</p>}
        {!loading && items.length > 0 && (
          <div className="divide-y divide-slate-800">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-slate-400">{item.message}</p>
                  <p className="text-xs text-slate-500">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                  </p>
                </div>
                {!item.read && (
                  <button
                    type="button"
                    onClick={() => markAsRead(item.id)}
                    className="rounded-lg border border-slate-800 px-3 py-1 text-xs text-slate-200 hover:bg-slate-900"
                  >
                    Отметить прочитанным
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Notifications;
