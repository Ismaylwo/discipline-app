import { supabase } from './supabase';

export interface AppNotification {
  id: string;
  title: string;
  message: string | null;
  type: 'task_due' | 'habit_reminder' | 'project_deadline' | 'achievement';
  read: boolean | null;
  metadata?: any;
  created_at: string | null;
}

export class NotificationService {
  private static instance: NotificationService;
  private channel: any = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    this.channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          this.showBrowserNotification(payload.new as AppNotification);
        }
      )
      .subscribe();
  }

  private showBrowserNotification(notification: AppNotification) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message || '',
        icon: '/favicon.ico'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message || '',
            icon: '/favicon.ico'
          });
        }
      });
    }
  }

  async createTaskDueNotification(taskId: string, hoursBefore: number) {
    const task = await supabase.from('tasks').select('*').eq('id', taskId).single();
    if (!task.data) return;

    await supabase.from('notifications').insert({
      user_id: task.data.user_id,
      title: `Дедлайн через ${hoursBefore} час${hoursBefore > 1 ? 'а' : ''}`,
      message: `Задача "${task.data.title}" должна быть выполнена.`,
      type: 'task_due',
      metadata: { taskId }
    });
  }

  async createHabitReminder(habitId: string, time: string) {
    const habit = await supabase.from('tasks').select('*').eq('id', habitId).single();
    if (!habit.data) return;

    await supabase.from('notifications').insert({
      user_id: habit.data.user_id,
      title: 'Напоминание о привычке',
      message: `Не забудьте "${habit.data.title}"`,
      type: 'habit_reminder',
      metadata: { habitId, time }
    });
  }

  async getUnreadNotifications(): Promise<AppNotification[]> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return [];

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false });

    const allowedTypes = ['task_due', 'habit_reminder', 'project_deadline', 'achievement'];

    return (data || []).map((item) => ({
      id: item.id,
      title: item.title ?? 'Уведомление',
      message: item.message ?? '',
      type: allowedTypes.includes(item.type) ? (item.type as AppNotification['type']) : 'achievement',
      read: item.read ?? false,
      metadata: item.metadata,
      created_at: item.created_at ?? null
    }));
  }

  async markAsRead(notificationId: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
  }

  cleanup() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
  }
}
