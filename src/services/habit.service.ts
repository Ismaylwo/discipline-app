import { supabase } from './supabase';

export class HabitService {
  static async updateHabitStreak(habitId: string) {
    const { data: logs } = await supabase
      .from('habit_logs')
      .select('date, completed')
      .eq('habit_id', habitId)
      .order('date', { ascending: false });

    if (!logs) return 0;

    let currentStreak = 0;
    let checkDate = new Date();

    for (let i = 0; i < 365; i += 1) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayLog = logs.find((log) => log.date === dateStr);
      if (!dayLog || !dayLog.completed) break;
      currentStreak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    if (currentStreak >= 7 && currentStreak % 7 === 0) {
      await this.sendMotivationalNotification(habitId, currentStreak);
    }

    return currentStreak;
  }

  private static async sendMotivationalNotification(habitId: string, streak: number) {
    const messages: Record<number, string> = {
      7: 'Отличная работа! Вы держите серию уже неделю!',
      30: 'Потрясающе! Целый месяц последовательности!',
      100: 'Легендарно! 100 дней подряд!'
    };

    const message = messages[streak] || `Вы продолжаете серию уже ${streak} дней!`;

    const { data: habit } = await supabase
      .from('tasks')
      .select('title, user_id')
      .eq('id', habitId)
      .single();

    if (!habit) return;

    await supabase.from('notifications').insert({
      user_id: habit.user_id,
      title: 'Достижение в привычке!',
      message: `${message} Привычка: "${habit.title}"`,
      type: 'achievement',
      metadata: { habitId, streak }
    });
  }

  // Автоматическое создание логов на неделю вперед
  static async createWeeklyHabitLogs(habitId: string) {
    const habit = await supabase.from('tasks').select('*').eq('id', habitId).single();
    if (!habit.data?.recurrence) return;

    const recurrence = habit.data.recurrence as {
      type: 'daily' | 'weekly';
      daysOfWeek?: number[];
    };

    const today = new Date();
    const logs = [] as { habit_id: string; date: string; completed: boolean }[];

    for (let i = 0; i < 7; i += 1) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();

      if (recurrence.type === 'daily' || (recurrence.daysOfWeek && recurrence.daysOfWeek.includes(dayOfWeek))) {
        logs.push({
          habit_id: habitId,
          date: date.toISOString().split('T')[0],
          completed: false
        });
      }
    }

    if (logs.length > 0) {
      await supabase.from('habit_logs').upsert(logs, {
        onConflict: 'habit_id,date'
      });
    }
  }
}
